package com.smartcampus.modules.ticket;

import com.smartcampus.modules.ticket.dto.AttachmentResponseDTO;
import com.smartcampus.security.AppUserDetails;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ForbiddenException;
import com.smartcampus.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {

    private final TicketAttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String BUCKET = "ticket-attachments";
    private static final int MAX_ATTACHMENTS = 3;

    @Transactional
    public AttachmentResponseDTO upload(UUID ticketId, MultipartFile file, UserDetails userDetails) {
        // 1. Verify ticket exists
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        // 2. Verify ownership (only ticket owner or admin can upload)
        AppUserDetails appUser = (AppUserDetails) userDetails;
        boolean isOwner = ticket.getReportedBy().equals(appUser.getId());
        boolean isAdmin = appUser.getRoles().contains("ADMIN");
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Only the ticket owner or admin can upload attachments");
        }

        // 3. Check max attachments
        long count = attachmentRepository.countByTicketId(ticketId);
        if (count >= MAX_ATTACHMENTS) {
            throw new BadRequestException("Maximum " + MAX_ATTACHMENTS + " attachments allowed per ticket");
        }

        // 4. Validate file type (images only)
        String mime = file.getContentType();
        if (mime == null || !mime.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed (received: " + mime + ")");
        }

        // 5. Upload to Supabase Storage
        String storagePath = ticketId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + storagePath;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);
            headers.setContentType(MediaType.parseMediaType(mime));

            HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
            restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);
        } catch (Exception e) {
            log.error("Failed to upload file to Supabase Storage", e);
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }

        // 6. Save metadata to DB
        String publicUrl = supabaseUrl + "/storage/v1/object/public/" + BUCKET + "/" + storagePath;

        TicketAttachment attachment = TicketAttachment.builder()
                .ticketId(ticketId)
                .fileName(file.getOriginalFilename())
                .fileUrl(publicUrl)
                .fileSize((int) file.getSize())
                .mimeType(mime)
                .uploadedAt(LocalDateTime.now())
                .build();

        attachment = attachmentRepository.save(attachment);

        return toDTO(attachment);
    }

    @Transactional
    public void delete(UUID ticketId, UUID attachId, UserDetails userDetails) {
        TicketAttachment attachment = attachmentRepository.findById(attachId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found: " + attachId));

        if (!attachment.getTicketId().equals(ticketId)) {
            throw new BadRequestException("Attachment does not belong to this ticket");
        }

        // Verify ownership
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        AppUserDetails appUser = (AppUserDetails) userDetails;
        boolean isOwner = ticket.getReportedBy().equals(appUser.getId());
        boolean isAdmin = appUser.getRoles().contains("ADMIN");
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Only the ticket owner or admin can delete attachments");
        }

        // Delete from Supabase Storage
        try {
            String fileUrl = attachment.getFileUrl();
            String storagePath = fileUrl.substring(fileUrl.indexOf(BUCKET + "/") + BUCKET.length() + 1);
            String deleteUrl = supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + storagePath;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.set("apikey", supabaseKey);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            restTemplate.exchange(deleteUrl, HttpMethod.DELETE, entity, String.class);
        } catch (Exception e) {
            log.warn("Failed to delete file from Supabase Storage (continuing with DB cleanup)", e);
        }

        attachmentRepository.delete(attachment);
    }

    private AttachmentResponseDTO toDTO(TicketAttachment att) {
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
