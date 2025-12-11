CREATE TABLE projects (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    -- use MySQL enum to match TaskStatus mapping
    status ENUM('TODO','DOING','DONE','ARCHIVED') NOT NULL,
    -- use MySQL enum to match JPA enum mapping
    priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
    due_at TIMESTAMP NULL,
    remind_at TIMESTAMP NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE task_tags (
    task_id BIGINT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (task_id, tag),
    CONSTRAINT fk_task_tags_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
