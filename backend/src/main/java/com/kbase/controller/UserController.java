package com.kbase.controller;

import com.kbase.model.User;
import com.kbase.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@Tag(name = "4. Users Management", description = "API Quản lý Người dùng dành cho Admin")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.kbase.repository.ProjectMemberRepository memberRepository;

    @Operation(summary = "Lấy danh sách người dùng", description = "Lấy tất cả tài khoản trong hệ thống")
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Operation(summary = "Lấy chi tiết người dùng theo ID", description = "Truy vấn thông tin người dùng theo user ID")
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Tạo người dùng mới", description = "Admin tạo tài khoản người dùng với phân quyền ADMIN, OWNER hoặc USER")
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String fullName = payload.get("fullName");
        String password = payload.get("password");
        String role = payload.getOrDefault("role", "USER").toUpperCase();
        String avatarUrl = payload.get("avatarUrl");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        if (fullName == null || fullName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Full name is required."));
        }
        if (password == null || password.trim().isEmpty()) {
            password = "password123";
        }

        if (userRepository.findByEmailIgnoreCase(email.trim()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists in system."));
        }

        if (avatarUrl == null || avatarUrl.trim().isEmpty()) {
            avatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";
        }

        User newUser = new User();
        newUser.setEmail(email.trim().toLowerCase());
        newUser.setFullName(fullName.trim());
        newUser.setPasswordHash(passwordEncoder.encode(password));
        newUser.setRole(role);
        newUser.setAvatarUrl(avatarUrl);

        User saved = userRepository.save(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @Operation(summary = "Đồng bộ tài khoản đăng nhập Google", description = "Tự động tạo hoặc cập nhật tài khoản đăng nhập từ Google OAuth vào PostgreSQL")
    @PostMapping("/sync")
    public ResponseEntity<User> syncGoogleUser(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String fullName = payload.get("fullName");
        String avatarUrl = payload.get("avatarUrl");
        String provider = payload.getOrDefault("authProvider", "GOOGLE");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
            .map(existing -> {
                if (fullName != null && !fullName.trim().isEmpty()) {
                    existing.setFullName(fullName.trim());
                }
                if (avatarUrl != null && !avatarUrl.trim().isEmpty()) {
                    existing.setAvatarUrl(avatarUrl.trim());
                }
                if (existing.getAuthProvider() == null || existing.getAuthProvider().equalsIgnoreCase("LOCAL")) {
                    existing.setAuthProvider(provider);
                }
                return userRepository.save(existing);
            })
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(cleanEmail);
                newUser.setFullName(fullName != null && !fullName.trim().isEmpty() ? fullName.trim() : cleanEmail.split("@")[0]);
                newUser.setRole("USER");
                newUser.setAvatarUrl(avatarUrl != null && !avatarUrl.trim().isEmpty() ? avatarUrl.trim() : "https://ui-avatars.com/api/?name=" + cleanEmail + "&background=2563eb&color=fff");
                newUser.setAuthProvider(provider);
                newUser.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                return userRepository.save(newUser);
            });

        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Cập nhật người dùng", description = "Cập nhật họ tên, quyền hạn, email hoặc mật khẩu mới")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        String oldEmail = user.getEmail();
        boolean roleChanged = false;
        String newRole = null;

        if (payload.containsKey("fullName") && !payload.get("fullName").trim().isEmpty()) {
            user.setFullName(payload.get("fullName").trim());
        }
        if (payload.containsKey("email") && !payload.get("email").trim().isEmpty()) {
            String newEmail = payload.get("email").trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.findByEmailIgnoreCase(newEmail).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email is already taken by another user."));
            }
            user.setEmail(newEmail);
        }
        if (payload.containsKey("role") && !payload.get("role").trim().isEmpty()) {
            newRole = payload.get("role").trim().toUpperCase();
            if (!newRole.equals(user.getRole())) {
                user.setRole(newRole);
                roleChanged = true;
            }
        }
        if (payload.containsKey("avatarUrl") && !payload.get("avatarUrl").trim().isEmpty()) {
            user.setAvatarUrl(payload.get("avatarUrl").trim());
        }
        if (payload.containsKey("password") && !payload.get("password").trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(payload.get("password").trim()));
        }

        User updated = userRepository.save(user);

        // Đồng bộ quyền hạn và thông tin sang các project_members
        try {
            String targetEmail = updated.getEmail();
            List<com.kbase.model.ProjectMember> memberships = memberRepository.findByEmailIgnoreCase(targetEmail);
            if (oldEmail != null && !targetEmail.equalsIgnoreCase(oldEmail)) {
                memberships.addAll(memberRepository.findByEmailIgnoreCase(oldEmail));
            }
            for (com.kbase.model.ProjectMember pm : memberships) {
                pm.setEmail(targetEmail);
                pm.setName(updated.getFullName());
                if (updated.getAvatarUrl() != null && !updated.getAvatarUrl().isBlank()) {
                    pm.setAvatarUrl(updated.getAvatarUrl());
                }
                if (roleChanged && newRole != null) {
                    if ("ADMIN".equalsIgnoreCase(newRole)) pm.setRole("Admin");
                    else if ("OWNER".equalsIgnoreCase(newRole)) pm.setRole("Owner");
                    else pm.setRole("User");
                }
                memberRepository.save(pm);
            }
        } catch (Exception e) {
            // Không để lỗi đồng bộ ảnh hưởng đến kết quả cập nhật user
        }

        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Xóa người dùng", description = "Xóa tài khoản khỏi hệ thống")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            try {
                List<com.kbase.model.ProjectMember> memberships = memberRepository.findByEmailIgnoreCase(user.getEmail());
                memberRepository.deleteAll(memberships);
            } catch (Exception ignored) {}
            userRepository.delete(user);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
