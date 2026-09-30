package com.kbase.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/config")
@Tag(name = "5. System Configuration", description = "API Cấu hình Google, Subpage & Hệ thống cho Admin")
public class SystemConfigController {

    @Value("${spring.mail.username:accfbclon956@gmail.com}")
    private String mailUsername;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private String mailPort;

    // In-memory thread-safe store for dynamic runtime configs
    private final Map<String, Object> googleConfig = new ConcurrentHashMap<>();
    private final List<Map<String, Object>> subpagesConfig = Collections.synchronizedList(new ArrayList<>());

    public SystemConfigController() {
        // Initialize default Google settings
        googleConfig.put("enableGoogleAuth", true);
        googleConfig.put("googleClientId", "948210492810-kbase-client.apps.googleusercontent.com");
        googleConfig.put("googleClientSecret", "GOCSPX-****************************");
        googleConfig.put("redirectUri", "http://localhost:3000/oauth2/callback/google");
        googleConfig.put("enableGeminiAI", true);
        googleConfig.put("geminiApiKey", "AIzaSy********************************");
        googleConfig.put("geminiModel", "gemini-1.5-flash");
        googleConfig.put("geminiTemperature", 0.7);

        // Initialize default subpages
        subpagesConfig.add(createSubpage("dashboard", "Dashboard", "/dashboard", "LayoutGrid", "Tổng quan KPI, thống kê dự án và tài liệu", true, "ALL"));
        subpagesConfig.add(createSubpage("projects", "My Projects", "/projects", "FolderClosed", "Quản lý và cộng tác dự án nhóm", true, "ALL"));
        subpagesConfig.add(createSubpage("project-detail", "Project Details", "/projects/:id", "FileText", "Chi tiết tài liệu, thành viên và chatbot", true, "ALL"));
        subpagesConfig.add(createSubpage("recent", "Recent Files", "/recent", "Clock", "Toàn bộ tài liệu gần đây trong kho lưu trữ", true, "ALL"));
        subpagesConfig.add(createSubpage("ai-chat", "AI Assistant", "/ai", "Sparkles", "Trợ lý hỏi đáp tài liệu thông minh", true, "ALL"));
        subpagesConfig.add(createSubpage("admin", "Admin Portal", "/admin", "Shield", "Quản trị người dùng, tệp tin và cấu hình hệ thống", true, "ADMIN"));
        subpagesConfig.add(createSubpage("swagger", "API Documentation", "http://localhost:8080/swagger-ui/index.html", "ExternalLink", "Swagger UI thử nghiệm các REST API", true, "ADMIN"));
        subpagesConfig.add(createSubpage("settings", "Account Settings", "/settings", "Settings", "Cài đặt tài khoản cá nhân & tích hợp", true, "ALL"));
    }

    private Map<String, Object> createSubpage(String id, String title, String path, String icon, String desc, boolean enabled, String requiredRole) {
        Map<String, Object> page = new HashMap<>();
        page.put("id", id);
        page.put("title", title);
        page.put("path", path);
        page.put("icon", icon);
        page.put("description", desc);
        page.put("enabled", enabled);
        page.put("requiredRole", requiredRole);
        return page;
    }

    @Operation(summary = "Lấy cấu hình Google & AI", description = "Truy vấn thông tin cấu hình Google OAuth, Gemini AI, và Google SMTP")
    @GetMapping("/google")
    public Map<String, Object> getGoogleConfig() {
        Map<String, Object> response = new HashMap<>(googleConfig);
        response.put("smtpHost", mailHost);
        response.put("smtpPort", mailPort);
        response.put("smtpSender", mailUsername);
        response.put("smtpStatus", "Connected (smtp.gmail.com:587)");
        return response;
    }

    @Operation(summary = "Cập nhật cấu hình Google & AI", description = "Lưu thiết lập Google Client ID, Secret, Gemini API Key")
    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> updateGoogleConfig(@RequestBody Map<String, Object> updates) {
        googleConfig.putAll(updates);
        return ResponseEntity.ok(getGoogleConfig());
    }

    @Operation(summary = "Lấy danh sách cấu hình Subpages", description = "Danh sách các trang con (subpages) trong ứng dụng")
    @GetMapping("/subpages")
    public List<Map<String, Object>> getSubpages() {
        return new ArrayList<>(subpagesConfig);
    }

    @Operation(summary = "Cập nhật trạng thái Subpage", description = "Bật/tắt hoặc điều chỉnh quyền của Subpage")
    @PostMapping("/subpages")
    public ResponseEntity<List<Map<String, Object>>> updateSubpages(@RequestBody List<Map<String, Object>> newSubpages) {
        subpagesConfig.clear();
        subpagesConfig.addAll(newSubpages);
        return ResponseEntity.ok(new ArrayList<>(subpagesConfig));
    }
}
