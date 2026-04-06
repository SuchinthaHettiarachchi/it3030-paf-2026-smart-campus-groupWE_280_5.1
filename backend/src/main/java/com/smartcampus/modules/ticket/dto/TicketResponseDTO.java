package com.smartcampus.modules.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TicketResponseDTO {

    private UUID id;
    private UUID resourceId;
    private UUID reportedBy;
    private UUID assignedTo;

    private String title;
    private String category;
    private String description;
    private String priority;
    private String status;

    private String location;
    private String contactName;
    private String contactPhone;
    private String contactEmail;

    private String resolutionNotes;
    private String rejectionReason;

    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<AttachmentResponseDTO> attachments;
    private List<CommentResponseDTO> comments;
}
