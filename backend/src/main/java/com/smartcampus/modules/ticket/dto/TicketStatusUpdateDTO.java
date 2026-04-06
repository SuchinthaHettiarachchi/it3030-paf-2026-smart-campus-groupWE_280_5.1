package com.smartcampus.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketStatusUpdateDTO {

    @NotBlank(message = "Status is required")
    private String status;

    private String resolutionNotes;
    private String rejectionReason;
}
