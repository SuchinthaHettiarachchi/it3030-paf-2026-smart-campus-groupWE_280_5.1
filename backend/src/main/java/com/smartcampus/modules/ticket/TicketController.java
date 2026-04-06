package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.TicketCreateDTO;
import com.smartcampus.modules.ticket.dto.TicketResponseDTO;
import com.smartcampus.modules.ticket.dto.TicketStatusUpdateDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    /** POST /api/tickets — Any authenticated user submits a ticket */
    @PostMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> create(
            @Valid @RequestBody TicketCreateDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = UUID.fromString(user.getUsername());
        return ResponseEntity.status(201).body(ticketService.create(dto, userId));
    }

    /** GET /api/tickets/my — Current user's own tickets */
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public ResponseEntity<List<TicketResponseDTO>> getMyTickets(
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = UUID.fromString(user.getUsername());
        return ResponseEntity.ok(ticketService.getMyTickets(userId));
    }

    /** GET /api/tickets — All tickets with optional filters (admin/tech only) */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<List<TicketResponseDTO>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(ticketService.getAll(status, priority, category));
    }

    /** GET /api/tickets/{id} — Ticket details (own for USER, any for ADMIN/TECH) */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ticketService.getById(id, user));
    }

    /** PATCH /api/tickets/{id}/status — Update status + notes */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody TicketStatusUpdateDTO dto) {
        return ResponseEntity.ok(ticketService.updateStatus(id, dto));
    }

    /** PATCH /api/tickets/{id}/assign — Assign technician (admin only) */
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponseDTO> assign(
            @PathVariable UUID id,
            @RequestParam UUID technicianId) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId));
    }
}
