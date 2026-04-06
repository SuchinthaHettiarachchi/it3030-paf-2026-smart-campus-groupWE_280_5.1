package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.*;
import com.smartcampus.security.AppUserDetails;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ForbiddenException;
import com.smartcampus.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;

    // Valid status transitions
    private static final Map<String, List<String>> VALID_TRANSITIONS = Map.of(
        "OPEN",        List.of("IN_PROGRESS", "REJECTED"),
        "IN_PROGRESS", List.of("RESOLVED", "REJECTED"),
        "RESOLVED",    List.of("CLOSED"),
        "CLOSED",      List.of(),
        "REJECTED",    List.of()
    );

    private static final List<String> VALID_CATEGORIES =
            List.of("ELECTRICAL", "PLUMBING", "IT", "FURNITURE", "OTHER");

    private static final List<String> VALID_PRIORITIES =
            List.of("LOW", "MEDIUM", "HIGH", "CRITICAL");

    // ── Create ──

    @Transactional
    public TicketResponseDTO create(TicketCreateDTO dto, UUID userId) {
        // Validate category
        if (!VALID_CATEGORIES.contains(dto.getCategory().toUpperCase())) {
            throw new BadRequestException("Invalid category: " + dto.getCategory()
                    + ". Must be one of: " + VALID_CATEGORIES);
        }

        // Validate priority if provided
        String priority = dto.getPriority() != null ? dto.getPriority().toUpperCase() : "MEDIUM";
        if (!VALID_PRIORITIES.contains(priority)) {
            throw new BadRequestException("Invalid priority: " + dto.getPriority()
                    + ". Must be one of: " + VALID_PRIORITIES);
        }

        Ticket ticket = Ticket.builder()
                .reportedBy(userId)
                .resourceId(dto.getResourceId())
                .title(dto.getTitle().trim())
                .category(dto.getCategory().toUpperCase())
                .description(dto.getDescription().trim())
                .priority(priority)
                .status("OPEN")
                .location(dto.getLocation())
                .contactName(dto.getContactName())
                .contactPhone(dto.getContactPhone())
                .contactEmail(dto.getContactEmail())
                .build();

        ticket = ticketRepository.save(ticket);
        return toResponseDTO(ticket);
    }

    // ── Read ──

    public List<TicketResponseDTO> getMyTickets(UUID userId) {
        return ticketRepository.findByReportedByOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public List<TicketResponseDTO> getAll(String status, String priority, String category) {
        return ticketRepository.findWithFilters(
                status != null ? status.toUpperCase() : null,
                priority != null ? priority.toUpperCase() : null,
                category != null ? category.toUpperCase() : null
            ).stream()
            .map(this::toResponseDTO)
            .toList();
    }

    public TicketResponseDTO getById(UUID id, UserDetails userDetails) {
        Ticket ticket = findTicketOrThrow(id);

        // Users can only see their own tickets; admin/technician can see all
        AppUserDetails appUser = (AppUserDetails) userDetails;
        boolean isOwner = ticket.getReportedBy().equals(appUser.getId());
        boolean isStaff = appUser.getRoles().contains("ADMIN")
                       || appUser.getRoles().contains("TECHNICIAN");

        if (!isOwner && !isStaff) {
            throw new ForbiddenException("You do not have permission to view this ticket");
        }

        TicketResponseDTO response = toResponseDTO(ticket);
        // Include attachments for detail view
        response.setAttachments(
            attachmentRepository.findByTicketId(id).stream()
                .map(this::toAttachmentDTO)
                .toList()
        );
        return response;
    }

    // ── Status Update ──

    @Transactional
    public TicketResponseDTO updateStatus(UUID id, TicketStatusUpdateDTO dto) {
        Ticket ticket = findTicketOrThrow(id);

        String currentStatus = ticket.getStatus();
        String newStatus = dto.getStatus().toUpperCase();

        List<String> allowed = VALID_TRANSITIONS.getOrDefault(currentStatus, List.of());
        if (!allowed.contains(newStatus)) {
            throw new BadRequestException(
                "Invalid status transition: " + currentStatus + " → " + newStatus
                + ". Allowed transitions: " + allowed);
        }

        // Enforce notes for certain transitions
        if ("RESOLVED".equals(newStatus) &&
            (dto.getResolutionNotes() == null || dto.getResolutionNotes().isBlank())) {
            throw new BadRequestException("Resolution notes are required when resolving a ticket");
        }
        if ("REJECTED".equals(newStatus) &&
            (dto.getRejectionReason() == null || dto.getRejectionReason().isBlank())) {
            throw new BadRequestException("Rejection reason is required when rejecting a ticket");
        }

        ticket.setStatus(newStatus);

        if ("RESOLVED".equals(newStatus)) {
            ticket.setResolutionNotes(dto.getResolutionNotes());
            ticket.setResolvedAt(LocalDateTime.now());
        } else if ("REJECTED".equals(newStatus)) {
            ticket.setRejectionReason(dto.getRejectionReason());
        } else if ("CLOSED".equals(newStatus)) {
            ticket.setClosedAt(LocalDateTime.now());
        }

        ticket = ticketRepository.save(ticket);
        return toResponseDTO(ticket);
    }

    // ── Assign Technician ──

    @Transactional
    public TicketResponseDTO assignTechnician(UUID ticketId, UUID technicianId) {
        Ticket ticket = findTicketOrThrow(ticketId);
        ticket.setAssignedTo(technicianId);
        ticket = ticketRepository.save(ticket);
        return toResponseDTO(ticket);
    }

    // ── Helpers ──

    private Ticket findTicketOrThrow(UUID id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + id));
    }

    private TicketResponseDTO toResponseDTO(Ticket ticket) {
        List<TicketAttachment> attachments = attachmentRepository.findByTicketId(ticket.getId());
        List<TicketComment> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());

        return TicketResponseDTO.builder()
                .id(ticket.getId())
                .resourceId(ticket.getResourceId())
                .reportedBy(ticket.getReportedBy())
                .assignedTo(ticket.getAssignedTo())
                .title(ticket.getTitle())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .location(ticket.getLocation())
                .contactName(ticket.getContactName())
                .contactPhone(ticket.getContactPhone())
                .contactEmail(ticket.getContactEmail())
                .resolutionNotes(ticket.getResolutionNotes())
                .rejectionReason(ticket.getRejectionReason())
                .resolvedAt(ticket.getResolvedAt())
                .closedAt(ticket.getClosedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .attachments(attachments.stream().map(this::toAttachmentDTO).toList())
                .commentCount(comments.size())
                .build();
    }

    private AttachmentResponseDTO toAttachmentDTO(TicketAttachment att) {
        return AttachmentResponseDTO.builder()
                .id(att.getId())
                .ticketId(att.getTicketId())
                .fileName(att.getFileName())
                .fileUrl(att.getFileUrl())
                .fileSize(att.getFileSize())
                .mimeType(att.getMimeType())
                .uploadedAt(att.getUploadedAt())
                .build();
    }
}
