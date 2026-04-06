package com.smartcampus.modules.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CommentResponseDTO {

    private UUID id;
    private UUID ticketId;
    private UUID authorId;
    private String content;
    private boolean internal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
