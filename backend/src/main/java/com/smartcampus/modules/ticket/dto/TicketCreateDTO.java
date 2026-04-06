package com.smartcampus.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class TicketCreateDTO {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Category is required")
    private String category;   // ELECTRICAL, PLUMBING, IT, FURNITURE, OTHER

    @NotBlank(message = "Description is required")
    private String description;

    private UUID resourceId;

    private String priority;   // LOW, MEDIUM, HIGH, CRITICAL – defaults to MEDIUM if null

    private String location;

    private String contactName;
    private String contactPhone;
    private String contactEmail;
}
