package com.example.todo.dto;

import com.example.todo.domain.Priority;
import com.example.todo.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Set;

public record TaskRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 2000) String description,
        TaskStatus status,
        Priority priority,
        Instant dueAt,
        Instant remindAt,
        Set<String> tags
) {}
