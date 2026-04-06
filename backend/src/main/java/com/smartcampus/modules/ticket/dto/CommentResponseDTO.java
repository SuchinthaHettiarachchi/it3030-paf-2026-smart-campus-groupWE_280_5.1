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
public class CommentResponseDTO {

    private UUID id;
    private UUID ticketId;
    private UUID authorId;
    private String content;
    private boolean internal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
