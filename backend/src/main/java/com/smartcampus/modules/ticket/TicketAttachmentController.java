package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.AttachmentResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/tickets/{ticketId}/attachments")
@RequiredArgsConstructor
public class TicketAttachmentController {

    private final AttachmentService attachmentService;

    // 7. POST /api/tickets/{ticketId}/attachments — Upload image
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<AttachmentResponseDTO> upload(
            @PathVariable UUID ticketId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(201)
                .body(attachmentService.upload(ticketId, file, user));
    }

    // 8. DELETE /api/tickets/{ticketId}/attachments/{attachId} — Delete attachment
    @DeleteMapping("/{attachId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID ticketId,
            @PathVariable UUID attachId,
            @AuthenticationPrincipal UserDetails user) {
        attachmentService.delete(ticketId, attachId, user);
        return ResponseEntity.noContent().build();
    }
}
