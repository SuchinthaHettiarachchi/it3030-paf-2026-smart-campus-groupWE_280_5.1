package com.smartcampus.modules.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AttachmentResponseDTO {

    private UUID id;
    private UUID ticketId;
    private String fileName;
    private String fileUrl;
    private Integer fileSize;
    private String mimeType;
    private LocalDateTime uploadedAt;
}
