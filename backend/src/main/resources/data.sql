-- Seed a demo account for deployments (idempotent)
MERGE INTO users (email, password, display_name, role)
KEY (email)
VALUES (
  '1412050571@qq.com',
  '$2a$10$wqZMM.XpLbcuFIofI5Pqke7bELGFYRP8klY1SPX3t1Z6DsoxCEVre', -- password: 123456
  '演示用户',
  'USER'
);
