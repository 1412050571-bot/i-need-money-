package com.example.todo.dto;

import com.example.todo.domain.Priority;
import com.example.todo.domain.TaskStatus;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

/**
 * Update DTO: fields are optional to allow partial updates.
 */
public record TaskUpdateRequest(
        Optional<String> title,
        Optional<String> description,
        Optional<TaskStatus> status,
        Optional<Priority> priority,
        Optional<Instant> dueAt,
        Optional<Instant> remindAt,
        Optional<Set<String>> tags
) {
}
