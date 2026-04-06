package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.AttachmentResponseDTO;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ForbiddenException;
import com.smartcampus.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final TicketAttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;
    private final TicketService ticketService;
    private final RestTemplate restTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.storage.bucket}")
    private String bucket;

    private static final int MAX_ATTACHMENTS = 3;

    // ── Upload ───────────────────────────────────────────────────
    @Transactional
    public AttachmentResponseDTO upload(UUID ticketId, MultipartFile file, UserDetails user) {
        // 1. Ticket must exist
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found: " + ticketId));

        // 2. Max 3 attachments
        long count = attachmentRepository.countByTicketId(ticketId);
        if (count >= MAX_ATTACHMENTS) {
            throw new BadRequestException("Maximum " + MAX_ATTACHMENTS + " attachments allowed per ticket");
        }

        // 3. Image files only
        String mime = file.getContentType();
        if (mime == null || !mime.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed (jpeg, png, gif, webp)");
        }

        // 4. Upload to Supabase Storage
        String objectPath = ticketId + "/" + UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        String uploadUrl  = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;
        String publicUrl  = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectPath;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("apikey", supabaseKey);
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.parseMediaType(mime));

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    uploadUrl, HttpMethod.PUT, requestEntity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BadRequestException("Failed to upload file to storage: " + response.getStatusCode());
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to read uploaded file: " + e.getMessage());
        }

        // 5. Persist metadata
        TicketAttachment attachment = TicketAttachment.builder()
                .ticketId(ticketId)
                .fileName(file.getOriginalFilename())
                .fileUrl(publicUrl)
                .fileSize((int) file.getSize())
                .mimeType(mime)
                .build();

        return ticketService.toAttachmentDTO(attachmentRepository.save(attachment));
    }

    // ── Delete ───────────────────────────────────────────────────
    @Transactional
    public void delete(UUID ticketId, UUID attachId, UserDetails user) {
        TicketAttachment attachment = attachmentRepository.findById(attachId)
                .orElseThrow(() -> new NotFoundException("Attachment not found: " + attachId));

        if (!attachment.getTicketId().equals(ticketId)) {
            throw new BadRequestException("Attachment does not belong to ticket " + ticketId);
        }

        // Ownership check: must own the ticket or be ADMIN
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new NotFoundException("Ticket not found"));
            // Extract user ID from username (UUID-based); replaced by AppUserDetails when Chanuka's module merges
            UUID userId;
            try { userId = UUID.fromString(user.getUsername()); }
            catch (IllegalArgumentException e) { throw new ForbiddenException("Cannot identify user"); }

            if (!ticket.getReportedBy().equals(userId)) {
                throw new ForbiddenException("You are not allowed to delete this attachment");
            }
        }

        // Delete from Supabase Storage
        String fileUrl = attachment.getFileUrl();
        // Extract object path from public URL
        String objectPath = fileUrl.substring(fileUrl.indexOf("/object/public/" + bucket + "/")
                + ("/object/public/" + bucket + "/").length());
        String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", supabaseKey);
        headers.set("Authorization", "Bearer " + supabaseKey);
        restTemplate.exchange(deleteUrl, HttpMethod.DELETE, new HttpEntity<>(headers), String.class);

        attachmentRepository.deleteById(attachId);
    }

    // ── List attachments for a ticket ────────────────────────────
    @Transactional(readOnly = true)
    public List<AttachmentResponseDTO> listByTicket(UUID ticketId) {
        return attachmentRepository.findByTicketId(ticketId).stream()
                .map(ticketService::toAttachmentDTO)
                .collect(Collectors.toList());
    }

    private String sanitize(String name) {
        return name == null ? "file" : name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
