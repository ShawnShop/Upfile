package com.kbase.repository;

import com.kbase.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProjectId(Long projectId);
    List<ProjectMember> findByProjectIdOrderByJoinedAtAsc(Long projectId);
    Optional<ProjectMember> findByProjectIdAndEmailIgnoreCase(Long projectId, String email);
    List<ProjectMember> findByEmailIgnoreCase(String email);

    @Transactional
    void deleteByProjectIdAndId(Long projectId, Long id);
}
