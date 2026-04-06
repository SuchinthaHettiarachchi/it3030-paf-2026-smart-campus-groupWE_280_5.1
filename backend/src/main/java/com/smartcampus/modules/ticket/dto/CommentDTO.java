package com.smartcampus.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentDTO {

    @NotBlank(message = "Comment content is required")
    private String content;

    private boolean internal = false;  // true = staff/admin only
}
