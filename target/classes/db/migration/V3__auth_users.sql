CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    avatar_url VARCHAR(500),
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 默认账号：user@example.com / 123456
INSERT INTO users (email, password, display_name, avatar_url, role)
VALUES (
    'user@example.com',
    '$2a$10$wqZMM.XpLbcuFIofI5Pqke7bELGFYRP8klY1SPX3t1Z6DsoxCEVre', -- 123456
    '普通用户',
    NULL,
    'USER'
) ON DUPLICATE KEY UPDATE email = email;
