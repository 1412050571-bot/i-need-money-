package com.example.todo.service;

import com.example.todo.domain.Project;
import com.example.todo.dto.ProjectRequest;
import com.example.todo.exception.NotFoundException;
import com.example.todo.repository.ProjectRepository;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final CurrentUserService currentUserService;

    public List<Project> findAll() {
        Long userId = currentUserService.getCurrentUser().getId();
        return projectRepository.findAllByUser_IdOrderByCreatedAtDesc(userId);
    }

    public Project findById(Long id) {
        Long userId = currentUserService.getCurrentUser().getId();
        return projectRepository.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new NotFoundException("Project not found: " + id));
    }

    public Project create(ProjectRequest request) {
        var user = currentUserService.getCurrentUser();
        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        project.setUser(user);
        return projectRepository.save(project);
    }

    public Project update(Long id, ProjectRequest request) {
        Project project = findById(id);
        project.setName(request.name());
        project.setDescription(request.description());
        return projectRepository.save(project);
    }

    public void delete(Long id) {
        Long userId = currentUserService.getCurrentUser().getId();
        if (!projectRepository.existsByIdAndUser_Id(id, userId)) {
            throw new NotFoundException("Project not found: " + id);
        }
        projectRepository.deleteById(id);
    }
}
