package com.kbase.config;

import com.kbase.model.Project;
import com.kbase.model.User;
import com.kbase.model.ProjectMember;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository memberRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Seed Admin (Mật khẩu: admin)
            User admin = new User(
                "admin@kbase.team",
                passwordEncoder.encode("admin"),
                "System Admin",
                "ADMIN",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            );
            userRepository.save(admin);

            // Seed Owner
            User owner = new User(
                "sarah.lee@kbase.team",
                passwordEncoder.encode("password123"),
                "Sarah Lee",
                "OWNER",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
            );
            userRepository.save(owner);

            // Seed User
            User user = new User(
                "alex.nguyen@kbase.team",
                passwordEncoder.encode("password123"),
                "Alex Nguyen",
                "USER",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
            );
            userRepository.save(user);

            // Seed Projects
            Project p1 = new Project();
            p1.setTitle("Digital Marketing Campaign");
            p1.setDescription("Q3 multi-channel marketing assets and decks.");
            p1.setOwnerId(admin.getId());
            projectRepository.save(p1);

            Project p2 = new Project();
            p2.setTitle("Website Redesign");
            p2.setDescription("Core product design system overhaul.");
            p2.setOwnerId(owner.getId());
            projectRepository.save(p2);

            Project p3 = new Project();
            p3.setTitle("Product Research");
            p3.setDescription("Customer interviews and user behavior telemetry.");
            p3.setOwnerId(owner.getId());
            projectRepository.save(p3);

            System.out.println(">>> Database seeded with Admin, Owner, User and Projects! <<<");
        }

        if (memberRepository.count() == 0) {
            projectRepository.findAll().forEach(p -> {
                Long pId = p.getId();
                if (pId == 1L) {
                    memberRepository.save(new ProjectMember(pId, "System Admin", "admin@kbase.team", "Admin", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"));
                    memberRepository.save(new ProjectMember(pId, "Sarah Lee", "sarah.lee@kbase.team", "Owner", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"));
                    memberRepository.save(new ProjectMember(pId, "Alex Nguyen", "alex.nguyen@kbase.team", "User", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"));
                } else if (pId == 2L) {
                    memberRepository.save(new ProjectMember(pId, "Sarah Lee", "sarah.lee@kbase.team", "Owner", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"));
                    memberRepository.save(new ProjectMember(pId, "System Admin", "admin@kbase.team", "Admin", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"));
                } else if (pId == 3L) {
                    memberRepository.save(new ProjectMember(pId, "Sarah Lee", "sarah.lee@kbase.team", "Owner", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"));
                    memberRepository.save(new ProjectMember(pId, "Alex Nguyen", "alex.nguyen@kbase.team", "User", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"));
                }
            });
            System.out.println(">>> Project members seeded successfully! <<<");
        }

        try {
            jdbcTemplate.execute("SELECT setval('projects_id_seq', COALESCE((SELECT MAX(id) FROM projects), 1))");
            jdbcTemplate.execute("SELECT setval('documents_id_seq', COALESCE((SELECT MAX(id) FROM documents), 1))");
            jdbcTemplate.execute("SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1))");
            jdbcTemplate.execute("SELECT setval('project_members_id_seq', COALESCE((SELECT MAX(id) FROM project_members), 1))");
        } catch (Exception ignored) {}
    }
}
