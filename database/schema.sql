-- ==============================================================================
-- KBase Database (PostgreSQL) - Tối giản cho Authentication & Workspace
-- ==============================================================================

-- 1. Bảng USERS (Dùng cho đăng nhập Login)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER', -- ADMIN, OWNER, USER
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng PROJECTS (Dự án)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng DOCUMENTS (Tài liệu lưu trữ)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- PDF, Excel, PowerPoint, Image, Video
    file_size_bytes BIGINT,
    storage_url TEXT,
    uploaded_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO users (email, password_hash, full_name, role, avatar_url)
VALUES 
    ('admin@kbase.team', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'System Admin', 'ADMIN', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    ('admin', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'System Admin', 'ADMIN', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    ('sarah.lee@kbase.team', '$2a$10$wT0vR7K5R/yN97c41l1/fex8Hj8sK8YnL90mQ97/aX51PZ8Qz8eC6', 'Sarah Lee', 'OWNER', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
    ('alex.nguyen@kbase.team', '$2a$10$wT0vR7K5R/yN97c41l1/fex8Hj8sK8YnL90mQ97/aX51PZ8Qz8eC6', 'Alex Nguyen', 'USER', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (id, title, description, owner_id)
VALUES
    (1, 'Digital Marketing Campaign', 'Q3 multi-channel marketing assets and decks.', 3),
    (2, 'Website Redesign', 'Core product design system overhaul.', 2),
    (3, 'Product Research', 'Customer interviews and user behavior telemetry.', 2)
ON CONFLICT (id) DO NOTHING;
