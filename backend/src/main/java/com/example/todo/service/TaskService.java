package com.example.todo.service;

import com.example.todo.domain.Project;
import com.example.todo.domain.Task;
import com.example.todo.domain.TaskStatus;
import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskUpdateRequest;
import com.example.todo.exception.NotFoundException;
import com.example.todo.repository.TaskRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final ProjectService projectService;
    private final CurrentUserService currentUserService;

    public Page<Task> search(Long projectId, Optional<String> keyword, Optional<TaskStatus> status,
                             Optional<Set<String>> tags, int page, int size, String sort) {
        // ensure project归属当前用户
        projectService.findById(projectId);
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        Specification<Task> spec = Specification.where(projectEquals(projectId))
                .and(notArchived())
                .and(ownerEquals())
                .and(keyword.map(this::titleOrDescriptionContains).orElse(null))
                .and(status.map(this::statusEquals).orElse(null))
                .and(tags.map(this::tagsIn).orElse(null));
        return taskRepository.findAll(spec, pageable);
    }

    @Transactional
    public Task create(Long projectId, TaskRequest request) {
        Project project = projectService.findById(projectId);
        Task task = new Task();
        task.setProject(project);
        task.setTitle(request.title());
        task.setDescription(request.description());
        if (request.status() != null) task.setStatus(request.status());
        if (request.priority() != null) task.setPriority(request.priority());
        task.setDueAt(request.dueAt());
        task.setRemindAt(request.remindAt());
        if (request.tags() != null) task.setTags(request.tags());
        task.setUpdatedAt(Instant.now());
        return taskRepository.save(task);
    }

    @Transactional
    public Task update(Long taskId, TaskUpdateRequest request) {
        Task task = findOwnedTask(taskId);
        request.title().ifPresent(task::setTitle);
        request.description().ifPresent(task::setDescription);
        request.status().ifPresent(task::setStatus);
        request.priority().ifPresent(task::setPriority);
        request.dueAt().ifPresent(task::setDueAt);
        request.remindAt().ifPresent(task::setRemindAt);
        request.tags().ifPresent(task::setTags);
        task.setUpdatedAt(Instant.now());
        return taskRepository.save(task);
    }

    public void archive(Long taskId) {
        Task task = findOwnedTask(taskId);
        task.setArchived(true);
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
    }

    public void delete(Long taskId) {
        Task task = findOwnedTask(taskId);
        taskRepository.delete(task);
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        String field = parts[0];
        Sort.Direction direction = parts.length > 1 ? Sort.Direction.fromString(parts[1]) : Sort.Direction.DESC;
        return Sort.by(direction, field);
    }

    private Specification<Task> projectEquals(Long projectId) {
        return (root, query, cb) -> cb.equal(root.get("project").get("id"), projectId);
    }

    private Specification<Task> ownerEquals() {
        Long userId = currentUserService.getCurrentUser().getId();
        return (root, query, cb) -> cb.equal(root.get("project").get("user").get("id"), userId);
    }

    private Specification<Task> notArchived() {
        return (root, query, cb) -> cb.isFalse(root.get("archived"));
    }

    private Specification<Task> titleOrDescriptionContains(String keyword) {
        return (root, query, cb) -> {
            String like = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("description")), like)
            );
        };
    }

    private Specification<Task> statusEquals(TaskStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private Specification<Task> tagsIn(Set<String> tags) {
        return (root, query, cb) -> root.join("tags").in(tags);
    }

    private Task findOwnedTask(Long taskId) {
        Long userId = currentUserService.getCurrentUser().getId();
        return taskRepository.findById(taskId)
                .filter(t -> t.getProject() != null && t.getProject().getUser() != null && userId.equals(t.getProject().getUser().getId()))
                .orElseThrow(() -> new NotFoundException("Task not found: " + taskId));
    }
}
