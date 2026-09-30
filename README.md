# Upfile (KBase - Knowledge Base)

Hệ thống quản lý tài liệu và kho tri thức dự án cho đội ngũ làm việc (Document Management & Knowledge Base).

## 🚀 Công nghệ sử dụng
- **Backend:** Java Spring Boot 3, Spring Data JPA, Spring Security (BCrypt), JavaMail SMTP, OpenAPI/Swagger
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Database:** PostgreSQL
- **Storage:** Supabase Storage

## 🛠 Hướng dẫn cài đặt & Khởi chạy

### 1. Cơ sở dữ liệu (PostgreSQL)
Chạy PostgreSQL thông qua Docker:
```bash
docker compose up -d
```
Hoặc nạp script tạo bảng từ file `database/schema.sql` vào PostgreSQL local của bạn.

### 2. Khởi chạy Backend
```bash
cd backend
mvn spring-boot:run
```
Backend API sẽ chạy tại `http://localhost:8080`.
Tài liệu Swagger UI: `http://localhost:8080/swagger-ui.html`.

### 3. Khởi chạy Frontend
```bash
cd frontend
npm install
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:5173`.
