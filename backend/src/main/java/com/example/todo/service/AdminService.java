package com.example.todo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final JdbcTemplate jdbcTemplate;

    public void clearDatabase() {
        // Disable FK checks to truncate safely
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=0");
        jdbcTemplate.execute("TRUNCATE TABLE task_tags");
        jdbcTemplate.execute("TRUNCATE TABLE tasks");
        jdbcTemplate.execute("TRUNCATE TABLE projects");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=1");
    }
}
