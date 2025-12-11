CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    avatar_url VARCHAR(500),
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, password, display_name, role)
SELECT
    '1412050571@qq.com',
    '$2a$10$wqZMM.XpLbcuFIofI5Pqke7bELGFYRP8klY1SPX3t1Z6DsoxCEVre', -- password: 123456
    '演示用户',
    'USER'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '1412050571@qq.com');
