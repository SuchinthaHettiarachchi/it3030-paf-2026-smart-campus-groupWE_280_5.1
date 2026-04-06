package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.CommentDTO;
import com.smartcampus.modules.ticket.dto.CommentResponseDTO;
import com.smartcampus.security.AppUserDetails;
import com.smartcampus.shared.exception.ForbiddenException;
import com.smartcampus.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final TicketCommentRepository commentRepository;
    private final TicketRepository ticketRepository;

    public List<CommentResponseDTO> getComments(UUID ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public CommentResponseDTO addComment(UUID ticketId, CommentDTO dto, UserDetails userDetails) {
        // Verify ticket exists
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResourceNotFoundException("Ticket not found: " + ticketId);
        }

        AppUserDetails appUser = (AppUserDetails) userDetails;

        TicketComment comment = TicketComment.builder()
                .ticketId(ticketId)
                .authorId(appUser.getId())
                .content(dto.getContent().trim())
                .internal(dto.isInternal())
                .build();

        comment = commentRepository.save(comment);
        return toDTO(comment);
    }

    @Transactional
    public CommentResponseDTO editComment(UUID ticketId, UUID commentId,
                                          CommentDTO dto, UserDetails userDetails) {
        TicketComment comment = findCommentOrThrow(commentId);
        verifyCommentBelongsToTicket(comment, ticketId);

        // Only the author can edit their own comment
        AppUserDetails appUser = (AppUserDetails) userDetails;
        if (!comment.getAuthorId().equals(appUser.getId())) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        comment.setContent(dto.getContent().trim());
        comment.setInternal(dto.isInternal());
        comment = commentRepository.save(comment);
        return toDTO(comment);
    }

    @Transactional
    public void deleteComment(UUID ticketId, UUID commentId, UserDetails userDetails) {
        TicketComment comment = findCommentOrThrow(commentId);
        verifyCommentBelongsToTicket(comment, ticketId);

        // Author can delete own comment; admin can delete any
        AppUserDetails appUser = (AppUserDetails) userDetails;
        boolean isAuthor = comment.getAuthorId().equals(appUser.getId());
        boolean isAdmin = appUser.getRoles().contains("ADMIN");

        if (!isAuthor && !isAdmin) {
            throw new ForbiddenException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    // ── Helpers ──

    private TicketComment findCommentOrThrow(UUID commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));
    }

    private void verifyCommentBelongsToTicket(TicketComment comment, UUID ticketId) {
        if (!comment.getTicketId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comment does not belong to this ticket");
        }
    }

    private CommentResponseDTO toDTO(TicketComment comment) {
        return CommentResponseDTO.builder()
                .id(comment.getId())
                .ticketId(comment.getTicketId())
                .authorId(comment.getAuthorId())
                .content(comment.getContent())
                .internal(comment.isInternal())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
