package com.smartcampus.modules.ticket;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "resource_id")
    private UUID resourceId;

    @Column(name = "reported_by", nullable = false)
    private UUID reportedBy;

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String title;

    /** ELECTRICAL, PLUMBING, IT, FURNITURE, OTHER */
    @NotBlank
    @Column(nullable = false, length = 50)
    private String category;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** LOW, MEDIUM, HIGH, CRITICAL */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String priority = "MEDIUM";

    /** OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "OPEN";

    @Column(length = 150)
    private String location;

    @Column(name = "contact_name", length = 100)
    private String contactName;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
