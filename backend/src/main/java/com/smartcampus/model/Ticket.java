package com.smartcampus.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;
    
    private String title;
    private String description;
    
    private String creatorId; // User who opened the ticket
    private String creatorName;
    
    private String resourceId; // Facility/Equipment having issue
    private String resourceName;
    
    private String assignedTechnicianId; // TECHNICIAN role user ID
    
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    
    private String rejectionReason; // Used when status is REJECTED
    
    private String imageUrl; // S3 link or local path to uploaded image
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
