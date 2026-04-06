package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.*;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ForbiddenException;
import com.smartcampus.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final TicketCommentRepository commentRepository;

    // ── Valid state transitions ──────────────────────────────────
    private static final Map<String, List<String>> VALID_TRANSITIONS = Map.of(
            "OPEN",        List.of("IN_PROGRESS", "REJECTED"),
            "IN_PROGRESS", List.of("RESOLVED", "REJECTED"),
            "RESOLVED",    List.of("CLOSED"),
            "CLOSED",      List.of(),
            "REJECTED",    List.of()
    );

    // ── Create ───────────────────────────────────────────────────
    @Transactional
    public TicketResponseDTO create(TicketCreateDTO dto, UUID reportedBy) {
        Ticket ticket = Ticket.builder()
                .reportedBy(reportedBy)
                .resourceId(dto.getResourceId())
                .title(dto.getTitle())
                .category(dto.getCategory().toUpperCase())
                .description(dto.getDescription())
                .priority(dto.getPriority() != null ? dto.getPriority().toUpperCase() : "MEDIUM")
                .status("OPEN")
                .location(dto.getLocation())
                .contactName(dto.getContactName())
                .contactPhone(dto.getContactPhone())
                .contactEmail(dto.getContactEmail())
                .build();

        return toDTO(ticketRepository.save(ticket));
    }

    // ── My Tickets (user's own) ──────────────────────────────────
    @Transactional(readOnly = true)
    public List<TicketResponseDTO> getMyTickets(UUID userId) {
        return ticketRepository.findByReportedBy(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── All tickets with filters (admin/tech) ────────────────────
    @Transactional(readOnly = true)
    public List<TicketResponseDTO> getAll(String status, String priority, String category) {
        return ticketRepository.findWithFilters(status, priority, category).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── Get by ID (ownership enforced for USER role) ─────────────
    @Transactional(readOnly = true)
    public TicketResponseDTO getById(UUID id, UserDetails user) {
        Ticket ticket = findOrThrow(id);

        boolean isAdminOrTech = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_TECHNICIAN"));

        if (!isAdminOrTech) {
            // USER can only see their own ticket
            UUID userId = extractUserId(user);
            if (!ticket.getReportedBy().equals(userId)) {
                throw new ForbiddenException("You are not allowed to view this ticket");
            }
        }

        List<AttachmentResponseDTO> attachments = attachmentRepository
                .findByTicketId(id).stream()
                .map(this::toAttachmentDTO)
                .collect(Collectors.toList());

        List<CommentResponseDTO> comments = commentRepository
                .findByTicketIdOrderByCreatedAtAsc(id).stream()
                .map(this::toCommentDTO)
                .collect(Collectors.toList());

        TicketResponseDTO dto = toDTO(ticket);
        dto.setAttachments(attachments);
        dto.setComments(comments);
        return dto;
    }

    // ── Update status (admin / technician) ───────────────────────
    @Transactional
    public TicketResponseDTO updateStatus(UUID id, TicketStatusUpdateDTO dto) {
        Ticket ticket = findOrThrow(id);

        String currentStatus = ticket.getStatus();
        String newStatus = dto.getStatus().toUpperCase();

        List<String> allowed = VALID_TRANSITIONS.getOrDefault(currentStatus, List.of());
        if (!allowed.contains(newStatus)) {
            throw new BadRequestException(
                    "Invalid transition: " + currentStatus + " → " + newStatus +
                    ". Allowed: " + allowed);
        }

        ticket.setStatus(newStatus);

        if ("RESOLVED".equals(newStatus)) {
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setResolutionNotes(dto.getResolutionNotes());
        }
        if ("CLOSED".equals(newStatus)) {
            ticket.setClosedAt(LocalDateTime.now());
        }
        if ("REJECTED".equals(newStatus)) {
            ticket.setRejectionReason(dto.getRejectionReason());
        }

        return toDTO(ticketRepository.save(ticket));
    }

    // ── Assign technician (admin only) ───────────────────────────
    @Transactional
    public TicketResponseDTO assignTechnician(UUID id, UUID technicianId) {
        Ticket ticket = findOrThrow(id);
        ticket.setAssignedTo(technicianId);
        return toDTO(ticketRepository.save(ticket));
    }

    // ── Helpers ──────────────────────────────────────────────────
    public Ticket findOrThrow(UUID id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found: " + id));
    }

    /**
     * Extracts UUID from UserDetails.
     * When Chanuka implements AppUserDetails, replace this with ((AppUserDetails) user).getId().
     */
    private UUID extractUserId(UserDetails user) {
        try {
            return UUID.fromString(user.getUsername());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Cannot extract user ID from principal");
        }
    }

    // ── Mapping helpers ──────────────────────────────────────────
    public TicketResponseDTO toDTO(Ticket t) {
        return TicketResponseDTO.builder()
                .id(t.getId())
                .resourceId(t.getResourceId())
                .reportedBy(t.getReportedBy())
                .assignedTo(t.getAssignedTo())
                .title(t.getTitle())
                .category(t.getCategory())
                .description(t.getDescription())
                .priority(t.getPriority())
                .status(t.getStatus())
                .location(t.getLocation())
                .contactName(t.getContactName())
                .contactPhone(t.getContactPhone())
                .contactEmail(t.getContactEmail())
                .resolutionNotes(t.getResolutionNotes())
                .rejectionReason(t.getRejectionReason())
                .resolvedAt(t.getResolvedAt())
                .closedAt(t.getClosedAt())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    public AttachmentResponseDTO toAttachmentDTO(TicketAttachment a) {
        return AttachmentResponseDTO.builder()
                .id(a.getId())
                .ticketId(a.getTicketId())
                .fileName(a.getFileName())
                .fileUrl(a.getFileUrl())
                .fileSize(a.getFileSize())
                .mimeType(a.getMimeType())
                .uploadedAt(a.getUploadedAt())
                .build();
    }

    public CommentResponseDTO toCommentDTO(TicketComment c) {
        return CommentResponseDTO.builder()
                .id(c.getId())
                .ticketId(c.getTicketId())
                .authorId(c.getAuthorId())
                .content(c.getContent())
                .internal(c.isInternal())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
