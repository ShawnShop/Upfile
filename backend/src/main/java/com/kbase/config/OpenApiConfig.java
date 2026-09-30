package com.kbase.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI kbaseOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("KBase - Knowledge Base REST API")
                .description("Tài liệu API chính thức của dự án KBase. Cho phép kiểm tra và thử nghiệm trực tiếp các API: Xác thực đăng nhập (Auth), Quản lý Dự án (Projects), Quản lý Tài liệu (Documents).")
                .version("1.0.0")
                .contact(new Contact()
                    .name("KBase Development Team")
                    .email("support@kbase.team"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://springdoc.org")))
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Local Development Server")
            ));
    }
}
