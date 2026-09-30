package com.kbase.model;

public class LoginResponse {
    private boolean success;
    private String message;
    private Long id;
    private String email;
    private String name;
    private String role;
    private String avatar;
    private String token;

    public LoginResponse() {}

    public LoginResponse(boolean success, String message, Long id, String email, String name, String role, String avatar, String token) {
        this.success = success;
        this.message = message;
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
        this.avatar = avatar;
        this.token = token;
    }

    public static LoginResponse failure(String message) {
        LoginResponse res = new LoginResponse();
        res.setSuccess(false);
        res.setMessage(message);
        return res;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
