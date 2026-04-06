package com.smartcampus.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketStatusUpdateDTO {

    @NotBlank(message = "Status is required")
    private String status;         // IN_PROGRESS, RESOLVED, CLOSED, REJECTED

    private String resolutionNotes;
    private String rejectionReason;
}
