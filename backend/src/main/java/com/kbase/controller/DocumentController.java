package com.kbase.controller;

import com.kbase.model.Document;
import com.kbase.repository.DocumentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@Tag(name = "3. Documents", description = "API Quản lý Tài liệu & Metadata File")
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private com.kbase.repository.UserRepository userRepository;

    @Operation(summary = "Lấy danh sách tài liệu", description = "Lấy toàn bộ tài liệu hoặc lọc theo projectId từ bảng documents")
    @GetMapping
    public List<Document> getAllDocuments(@RequestParam(required = false) Long projectId) {
        List<Document> list = projectId != null
            ? documentRepository.findByProjectId(projectId)
            : documentRepository.findAllByOrderByCreatedAtDesc();

        for (Document d : list) {
            if ((d.getUploadedByName() == null || d.getUploadedByName().trim().isEmpty()) && d.getUploadedBy() != null) {
                userRepository.findById(d.getUploadedBy()).ifPresent(u -> {
                    d.setUploadedByName(u.getFullName());
                    d.setUploadedByAvatar(u.getAvatarUrl());
                });
            }
        }
        return list;
    }

    @Operation(summary = "Lưu metadata tài liệu mới", description = "Lưu thông tin file (tên file, kích thước, link Supabase Storage, người upload) vào PostgreSQL")
    @PostMapping
    public ResponseEntity<Document> uploadDocument(@RequestBody Document document) {
        if (document.getFileName() == null || document.getFileName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if ((document.getUploadedByName() == null || document.getUploadedByName().trim().isEmpty()) && document.getUploadedBy() != null) {
            userRepository.findById(document.getUploadedBy()).ifPresent(u -> {
                document.setUploadedByName(u.getFullName());
                document.setUploadedByAvatar(u.getAvatarUrl());
            });
        }
        Document saved = documentRepository.save(document);
        return ResponseEntity.ok(saved);
    }

    @Operation(summary = "Xóa tài liệu", description = "Xóa tài liệu theo ID từ PostgreSQL")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        if (documentRepository.existsById(id)) {
            documentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
