package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.CommentDTO;
import com.smartcampus.modules.ticket.dto.CommentResponseDTO;
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
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class TicketCommentController {

    private final TicketCommentService commentService;

    /** POST /api/tickets/{ticketId}/comments */
    @PostMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public ResponseEntity<CommentResponseDTO> addComment(
            @PathVariable UUID ticketId,
            @Valid @RequestBody CommentDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201).body(commentService.addComment(ticketId, dto, user));
    }

    /** GET /api/tickets/{ticketId}/comments */
    @GetMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public ResponseEntity<List<CommentResponseDTO>> listComments(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(commentService.listByTicket(ticketId));
    }

    /** PUT /api/tickets/{ticketId}/comments/{commentId} — own author only */
    @PutMapping("/{commentId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public ResponseEntity<CommentResponseDTO> editComment(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId,
            @Valid @RequestBody CommentDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(commentService.editComment(ticketId, commentId, dto, user));
    }

    /** DELETE /api/tickets/{ticketId}/comments/{commentId} — own author or admin */
    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID ticketId,
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails user) {
        commentService.deleteComment(ticketId, commentId, user);
        return ResponseEntity.noContent().build();
    }
}
