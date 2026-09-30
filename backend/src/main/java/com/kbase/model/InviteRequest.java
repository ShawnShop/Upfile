package com.kbase.model;

public class InviteRequest {
    private String email;
    private String name;
    private String role; // Admin, Owner, User
    private String projectName;
    private String inviterName;
    private String inviteUrl;
    private String inviteCode;

    public InviteRequest() {}

    public InviteRequest(String email, String name, String role, String projectName, String inviterName, String inviteUrl, String inviteCode) {
        this.email = email;
        this.name = name;
        this.role = role;
        this.projectName = projectName;
        this.inviterName = inviterName;
        this.inviteUrl = inviteUrl;
        this.inviteCode = inviteCode;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getInviterName() { return inviterName; }
    public void setInviterName(String inviterName) { this.inviterName = inviterName; }

    public String getInviteUrl() { return inviteUrl; }
    public void setInviteUrl(String inviteUrl) { this.inviteUrl = inviteUrl; }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
}
