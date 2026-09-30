package com.kbase.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:accfbclon956@gmail.com}")
    private String fromEmail;

    public boolean sendProjectInvitation(String toEmail, String recipientName, String projectName, String role, String inviterName, String inviteUrl, String inviteCode) {
        if (mailSender == null) {
            log.error("JavaMailSender is not initialized. Please verify mail configuration in application.properties.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "KBase Workspace");
            helper.setTo(toEmail);
            helper.setSubject("🚀 Lời mời tham gia dự án: " + projectName + " trên KBase");

            String safeName = (recipientName != null && !recipientName.isBlank()) ? recipientName : "bạn";
            String safeInviter = (inviterName != null && !inviterName.isBlank()) ? inviterName : "Quản trị viên";
            String safeRole = (role != null) ? role : "User";
            String safeUrl = (inviteUrl != null && !inviteUrl.isBlank()) ? inviteUrl : "http://localhost:3000/login";
            String safeCode = (inviteCode != null && !inviteCode.isBlank()) ? inviteCode : "KB-" + Math.abs(projectName.hashCode() % 10000);

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
                        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff; }
                        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                        .content { padding: 32px 24px; line-height: 1.6; }
                        .badge { display: inline-block; background-color: #eff6ff; color: #2563eb; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 9999px; border: 1px solid #bfdbfe; margin-top: 4px; }
                        .box { background-color: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #e2e8f0; }
                        .code-box { display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px; font-weight: 700; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 8px; border: 1px solid #c7d2fe; letter-spacing: 1px; }
                        .button { display: block; text-align: center; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 10px; margin: 28px 0 16px; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>KBase - Knowledge Base</h1>
                        </div>
                        <div class="content">
                            <p style="font-size: 16px;">Xin chào <b>%s</b>,</p>
                            <p><b>%s</b> vừa mời bạn tham gia vào nhóm làm việc của dự án trên nền tảng <b>KBase</b>.</p>
                            
                            <div class="box">
                                <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Dự án:</p>
                                <p style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #0f172a;">%s</p>
                                
                                <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Mã mời tham gia:</p>
                                <p style="margin: 0 0 12px 0;"><span class="code-box">%s</span></p>

                                <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Vai trò được cấp:</p>
                                <span class="badge">%s</span>
                            </div>

                            <p>Bạn chỉ cần nhấp vào nút bên dưới để mở liên kết mời riêng biệt này và tham gia nhóm ngay lập tức:</p>

                            <a href="%s" class="button">Chấp nhận lời mời & Tham gia nhóm</a>

                            <p style="font-size: 12px; color: #64748b; margin-top: 24px; word-break: break-all;">
                                Hoặc copy liên kết mời này vào trình duyệt: <br/>
                                <a href="%s" style="color: #2563eb; text-decoration: underline;">%s</a>
                            </p>
                        </div>
                        <div class="footer">
                            &copy; 2026 KBase Team. All rights reserved.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(safeName, safeInviter, projectName, safeCode, safeRole, safeUrl, safeUrl, safeUrl);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Invitation email successfully dispatched to {}", toEmail);
            return true;
        } catch (MessagingException e) {
            log.error("Failed to compose/send email to {}: {}", toEmail, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error when sending email: {}", e.getMessage(), e);
            return false;
        }
    }
}
