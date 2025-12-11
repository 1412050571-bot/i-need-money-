-- Align MySQL enum values with Java enums (upper-case)
ALTER TABLE tasks
    MODIFY status ENUM('TODO', 'DOING', 'DONE', 'ARCHIVED') NOT NULL,
    MODIFY priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL;
