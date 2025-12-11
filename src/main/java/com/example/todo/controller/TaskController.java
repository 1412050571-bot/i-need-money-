package com.example.todo.controller;

import com.example.todo.domain.TaskStatus;
import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskUpdateRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/projects/{projectId}/tasks")
    public Page<TaskResponse> search(@PathVariable("projectId") Long projectId,
                                     @RequestParam(name = "keyword") Optional<String> keyword,
                                     @RequestParam(name = "status") Optional<TaskStatus> status,
                                     @RequestParam(name = "tags") Optional<Set<String>> tags,
                                     @RequestParam(name = "page", defaultValue = "0") int page,
                                     @RequestParam(name = "size", defaultValue = "20") int size,
                                     @RequestParam(name = "sort", defaultValue = "createdAt,DESC") String sort) {
        return taskService.search(projectId, keyword, status, tags, page, size, sort)
                .map(TaskResponse::from);
    }

    @PostMapping("/projects/{projectId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@PathVariable("projectId") Long projectId, @Valid @RequestBody TaskRequest request) {
        return TaskResponse.from(taskService.create(projectId, request));
    }

    @PutMapping("/tasks/{taskId}")
    public TaskResponse update(@PathVariable("taskId") Long taskId, @Valid @RequestBody TaskUpdateRequest request) {
        return TaskResponse.from(taskService.update(taskId, request));
    }

    @PostMapping("/tasks/{taskId}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable("taskId") Long taskId) {
        taskService.archive(taskId);
    }

    @DeleteMapping("/tasks/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("taskId") Long taskId) {
        taskService.delete(taskId);
    }
}
