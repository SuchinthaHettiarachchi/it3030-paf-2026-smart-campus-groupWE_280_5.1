package com.smartcampus.modules.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
