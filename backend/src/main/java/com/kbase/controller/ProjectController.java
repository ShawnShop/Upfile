package com.kbase.controller;

import com.kbase.model.InviteRequest;
import com.kbase.model.Project;
import com.kbase.model.ProjectMember;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import com.kbase.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "2. Projects", description = "API Quản lý Dự án")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository memberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Operation(summary = "Lấy danh sách dự án", description = "Truy vấn toàn bộ dự án từ bảng projects sắp xếp theo ngày tạo mới nhất")
    @GetMapping
    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderByCreatedAtDesc();
    }

    private void syncMembersWithUsers(List<ProjectMember> members) {
        if (members == null || members.isEmpty()) return;
        for (ProjectMember m : members) {
            if (m.getEmail() != null && !m.getEmail().isBlank()) {
                userRepository.findByEmailIgnoreCase(m.getEmail().trim()).ifPresent(u -> {
                    String expectedRole = "User";
                    if ("ADMIN".equalsIgnoreCase(u.getRole())) {
                        expectedRole = "Admin";
                    } else if ("OWNER".equalsIgnoreCase(u.getRole())) {
                        expectedRole = "Owner";
                    }
                    boolean needSave = false;
                    if (!expectedRole.equalsIgnoreCase(m.getRole())) {
                        m.setRole(expectedRole);
                        needSave = true;
                    }
                    if (u.getFullName() != null && !u.getFullName().isBlank() && !u.getFullName().equals(m.getName())) {
                        m.setName(u.getFullName());
                        needSave = true;
                    }
                    if (u.getAvatarUrl() != null && !u.getAvatarUrl().isBlank() && !u.getAvatarUrl().equals(m.getAvatarUrl())) {
                        m.setAvatarUrl(u.getAvatarUrl());
                        needSave = true;
                    }
                    if (needSave) {
                        memberRepository.save(m);
                    }
                });
            }
        }
    }

    @Operation(summary = "Lấy tất cả thành viên của mọi dự án")
    @GetMapping("/members")
    public List<ProjectMember> getAllMembers() {
        List<ProjectMember> members = memberRepository.findAll();
        syncMembersWithUsers(members);
        return members;
    }

    @Operation(summary = "Tạo dự án mới", description = "Lưu dự án mới vào PostgreSQL")
    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        if (project.getTitle() == null || project.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Project saved = projectRepository.save(project);
        if (saved.getOwnerId() != null) {
            userRepository.findById(saved.getOwnerId()).ifPresent(u -> {
                String roleToSet = "Owner";
                if ("ADMIN".equalsIgnoreCase(u.getRole())) {
                    roleToSet = "Admin";
                } else if ("USER".equalsIgnoreCase(u.getRole())) {
                    roleToSet = "User";
                }
                ProjectMember ownerMem = new ProjectMember(
                    saved.getId(),
                    u.getFullName() != null ? u.getFullName() : "Project Owner",
                    u.getEmail(),
                    roleToSet,
                    u.getAvatarUrl()
                );
                memberRepository.save(ownerMem);
            });
        }
        return ResponseEntity.ok(saved);
    }

    @Operation(summary = "Lấy thông tin chi tiết dự án", description = "Tìm dự án theo ID")
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Cập nhật thông tin dự án", description = "Cập nhật tiêu đề, mô tả hoặc chủ sở hữu dự án")
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Project updated) {
        return projectRepository.findById(id).map(existing -> {
            if (updated.getTitle() != null && !updated.getTitle().trim().isEmpty()) {
                existing.setTitle(updated.getTitle().trim());
            }
            if (updated.getDescription() != null) {
                existing.setDescription(updated.getDescription().trim());
            }
            if (updated.getOwnerId() != null) {
                existing.setOwnerId(updated.getOwnerId());
            }
            Project saved = projectRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Xóa dự án", description = "Xóa dự án theo ID từ PostgreSQL")
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        if (projectRepository.existsById(id)) {
            projectRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @Operation(summary = "Gửi email lời mời tham gia dự án", description = "Gửi thư mời qua Google SMTP tới email thành viên")
    @PostMapping("/invite")
    public ResponseEntity<?> inviteMember(@RequestBody InviteRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email người nhận là bắt buộc."));
        }

        boolean sent = emailService.sendProjectInvitation(
            request.getEmail().trim(),
            request.getName(),
            request.getProjectName(),
            request.getRole(),
            request.getInviterName(),
            request.getInviteUrl(),
            request.getInviteCode()
        );

        if (sent) {
            // Tự động lưu thành viên được mời vào bảng project_members
            if (request.getProjectName() != null) {
                projectRepository.findAll().stream()
                    .filter(p -> p.getTitle().equalsIgnoreCase(request.getProjectName().trim()))
                    .findFirst()
                    .ifPresent(proj -> {
                        String email = request.getEmail().trim().toLowerCase();
                        if (memberRepository.findByProjectIdAndEmailIgnoreCase(proj.getId(), email).isEmpty()) {
                            String roleToSet = (request.getRole() != null && !request.getRole().isBlank()) ? request.getRole() : "User";
                            var userOpt = userRepository.findByEmailIgnoreCase(email);
                            if (userOpt.isPresent()) {
                                String sysRole = userOpt.get().getRole();
                                if ("ADMIN".equalsIgnoreCase(sysRole)) roleToSet = "Admin";
                                else if ("OWNER".equalsIgnoreCase(sysRole)) roleToSet = "Owner";
                                else roleToSet = "User";
                            }
                            ProjectMember newMem = new ProjectMember(
                                proj.getId(),
                                request.getName(),
                                email,
                                roleToSet,
                                "https://ui-avatars.com/api/?name=" + request.getName() + "&background=2563eb&color=fff"
                            );
                            memberRepository.save(newMem);
                        }
                    });
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Email lời mời đã được gửi thành công tới " + request.getEmail()
            ));
        } else {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Không thể gửi email qua Google SMTP. Vui lòng kiểm tra lại mật khẩu ứng dụng."
            ));
        }
    }

    @Operation(summary = "Lấy danh sách thành viên của một dự án")
    @GetMapping("/{id:\\d+}/members")
    public List<ProjectMember> getMembersByProject(@PathVariable Long id) {
        List<ProjectMember> members = memberRepository.findByProjectIdOrderByJoinedAtAsc(id);
        syncMembersWithUsers(members);
        return members;
    }

    @Operation(summary = "Thêm hoặc cập nhật thành viên vào dự án")
    @PostMapping("/{id:\\d+}/members")
    public ResponseEntity<ProjectMember> addOrUpdateMember(@PathVariable Long id, @RequestBody ProjectMember member) {
        if (member == null || member.getEmail() == null || member.getEmail().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String email = member.getEmail().trim().toLowerCase();

        // Đồng bộ vai trò theo tài khoản Users trong hệ thống nếu có
        String finalRole = (member.getRole() != null && !member.getRole().isBlank()) ? member.getRole() : "User";
        var userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isPresent()) {
            String sysRole = userOpt.get().getRole();
            if ("ADMIN".equalsIgnoreCase(sysRole)) {
                finalRole = "Admin";
            } else if ("OWNER".equalsIgnoreCase(sysRole)) {
                finalRole = "Owner";
            } else {
                finalRole = "User";
            }
            if (member.getName() == null || member.getName().isBlank()) {
                member.setName(userOpt.get().getFullName());
            }
            if (member.getAvatarUrl() == null || member.getAvatarUrl().isBlank()) {
                member.setAvatarUrl(userOpt.get().getAvatarUrl());
            }
        }

        final String resolvedRole = finalRole;

        ProjectMember saved = memberRepository.findByProjectIdAndEmailIgnoreCase(id, email)
            .map(existing -> {
                if (member.getName() != null && !member.getName().isBlank()) existing.setName(member.getName().trim());
                existing.setRole(resolvedRole);
                if (member.getAvatarUrl() != null && !member.getAvatarUrl().isBlank()) existing.setAvatarUrl(member.getAvatarUrl());
                return memberRepository.save(existing);
            })
            .orElseGet(() -> {
                member.setProjectId(id);
                member.setEmail(email);
                member.setRole(resolvedRole);
                if (member.getName() == null || member.getName().isBlank()) {
                    member.setName(email.split("@")[0]);
                }
                return memberRepository.save(member);
            });

        return ResponseEntity.ok(saved);
    }

    @Operation(summary = "Xóa thành viên khỏi dự án")
    @org.springframework.transaction.annotation.Transactional
    @DeleteMapping("/{id:\\d+}/members/{memberId:\\d+}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long memberId) {
        memberRepository.deleteByProjectIdAndId(id, memberId);
        return ResponseEntity.noContent().build();
    }
}
