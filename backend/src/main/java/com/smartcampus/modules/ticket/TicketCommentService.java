package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.CommentDTO;
import com.smartcampus.modules.ticket.dto.CommentResponseDTO;
import com.smartcampus.shared.exception.ForbiddenException;
import com.smartcampus.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketCommentService {

    private final TicketCommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final TicketService ticketService;

    // ── Add comment ──────────────────────────────────────────────
    @Transactional
    public CommentResponseDTO addComment(UUID ticketId, CommentDTO dto, UserDetails user) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new NotFoundException("Ticket not found: " + ticketId);
        }
        UUID authorId = extractUserId(user);

        TicketComment comment = TicketComment.builder()
                .ticketId(ticketId)
                .authorId(authorId)
                .content(dto.getContent())
                .internal(dto.isInternal())
                .build();

        return ticketService.toCommentDTO(commentRepository.save(comment));
    }

    // ── Edit comment (own author only) ───────────────────────────
    @Transactional
    public CommentResponseDTO editComment(UUID ticketId, UUID commentId, CommentDTO dto, UserDetails user) {
        TicketComment comment = findOrThrow(commentId, ticketId);

        UUID userId = extractUserId(user);
        if (!comment.getAuthorId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        comment.setContent(dto.getContent());
        comment.setInternal(dto.isInternal());
        return ticketService.toCommentDTO(commentRepository.save(comment));
    }

    // ── Delete comment (own author or admin) ─────────────────────
    @Transactional
    public void deleteComment(UUID ticketId, UUID commentId, UserDetails user) {
        TicketComment comment = findOrThrow(commentId, ticketId);

        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            UUID userId = extractUserId(user);
            if (!comment.getAuthorId().equals(userId)) {
                throw new ForbiddenException("You can only delete your own comments");
            }
        }

        commentRepository.deleteById(commentId);
    }

    // ── List comments for a ticket ───────────────────────────────
    @Transactional(readOnly = true)
    public List<CommentResponseDTO> listByTicket(UUID ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(ticketService::toCommentDTO)
                .collect(Collectors.toList());
    }

    // ── Helpers ──────────────────────────────────────────────────
    private TicketComment findOrThrow(UUID commentId, UUID ticketId) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found: " + commentId));
        if (!comment.getTicketId().equals(ticketId)) {
            throw new NotFoundException("Comment does not belong to ticket " + ticketId);
        }
        return comment;
    }

    private UUID extractUserId(UserDetails user) {
        try {
            return UUID.fromString(user.getUsername());
        } catch (IllegalArgumentException e) {
            throw new ForbiddenException("Cannot identify user");
        }
    }
}
