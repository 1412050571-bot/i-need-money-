package com.example.todo.dto;

import com.example.todo.domain.Priority;
import com.example.todo.domain.Task;
import com.example.todo.domain.TaskStatus;

import java.time.Instant;
import java.util.Set;

public record TaskResponse(
        Long id,
        Long projectId,
        String title,
        String description,
        TaskStatus status,
        Priority priority,
        Instant dueAt,
        Instant remindAt,
        Set<String> tags,
        boolean archived,
        Instant createdAt,
        Instant updatedAt
) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getProject() != null ? task.getProject().getId() : null,
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueAt(),
                task.getRemindAt(),
                task.getTags(),
                task.isArchived(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
