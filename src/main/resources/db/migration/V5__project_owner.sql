ALTER TABLE projects ADD COLUMN user_id BIGINT;
UPDATE projects SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1);
ALTER TABLE projects MODIFY user_id BIGINT NOT NULL;
ALTER TABLE projects ADD CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id);
