package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.TicketCreateDTO;
import com.smartcampus.modules.ticket.dto.TicketResponseDTO;
import com.smartcampus.modules.ticket.dto.TicketStatusUpdateDTO;
import com.smartcampus.security.AppUserDetails;
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

    // 1. POST /api/tickets — Create new ticket
    @PostMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<TicketResponseDTO> create(
            @Valid @RequestBody TicketCreateDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = ((AppUserDetails) user).getId();
        return ResponseEntity.status(201).body(ticketService.create(dto, userId));
    }

    // 2. GET /api/tickets/my — Get current user's tickets
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<TicketResponseDTO>> getMyTickets(
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = ((AppUserDetails) user).getId();
        return ResponseEntity.ok(ticketService.getMyTickets(userId));
    }

    // 3. GET /api/tickets — Get all tickets with filters (admin/technician)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<List<TicketResponseDTO>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(ticketService.getAll(status, priority, category));
    }

    // 4. GET /api/tickets/{id} — Get ticket details
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ticketService.getById(id, user));
    }

    // 5. PATCH /api/tickets/{id}/status — Update status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody TicketStatusUpdateDTO dto) {
        return ResponseEntity.ok(ticketService.updateStatus(id, dto));
    }

    // 6. PATCH /api/tickets/{id}/assign — Assign technician
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponseDTO> assign(
            @PathVariable UUID id,
            @RequestParam UUID technicianId) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId));
    }
}
