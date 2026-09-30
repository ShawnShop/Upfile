package com.kbase.repository;

import com.kbase.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findAllByOrderByCreatedAtDesc();
    List<Document> findByProjectId(Long projectId);
}
