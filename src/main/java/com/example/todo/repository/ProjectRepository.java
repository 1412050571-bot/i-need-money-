package com.example.todo.repository;

import com.example.todo.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    java.util.List<Project> findAllByUser_IdOrderByCreatedAtDesc(Long userId);
    java.util.Optional<Project> findByIdAndUser_Id(Long id, Long userId);
    boolean existsByIdAndUser_Id(Long id, Long userId);
}
