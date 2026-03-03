package com.smartcampus.controller;

import com.smartcampus.model.Comment;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.TicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    public TicketController(TicketService ticketService, UserRepository userRepository) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(OAuth2User principal) {
        if (principal == null) {
            // Dev mode: Return a default admin user
            // In production, this would throw 401
            User devUser = new User();
            devUser.setId("dev-admin-123");
            devUser.setName("Developer Admin");
            devUser.setEmail("dev-admin@smartcampus.local");
            devUser.setRole(com.smartcampus.model.Role.ADMIN);
            return devUser;
        }
        String email = principal.getAttribute("email");
        
        // Handle dev users that don't exist in database
        if (email != null && email.startsWith("dev-")) {
            User devUser = new User();
            devUser.setEmail(email);
            
            if (email.contains("admin")) {
                devUser.setId("dev-admin-123");
                devUser.setName("Developer Admin");
                devUser.setRole(com.smartcampus.model.Role.ADMIN);
            } else if (email.contains("user")) {
                devUser.setId("dev-user-456");
                devUser.setName("Student User");
                devUser.setRole(com.smartcampus.model.Role.USER);
            } else if (email.contains("technician")) {
                devUser.setId("dev-tech-789");
                devUser.setName("Campus Technician");
                devUser.setRole(com.smartcampus.model.Role.TECHNICIAN);
            } else {
                devUser.setId("dev-123");
                devUser.setName("Dev User");
                devUser.setRole(com.smartcampus.model.Role.USER);
            }
            return devUser;
        }
        
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<Ticket>> getTickets(@AuthenticationPrincipal OAuth2User principal,
                                                   @RequestParam(required = false) String context) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        if ("my-tickets".equals(context)) {
            return ResponseEntity.ok(ticketService.getUserTickets(user.getId()));
        } else if ("assigned".equals(context)) {
            return ResponseEntity.ok(ticketService.getTechnicianTickets(user.getId()));
        } else {
            // Suppose ADMIN or TECHNICIAN gets all
            return ResponseEntity.ok(ticketService.getAllTickets());
        }
    }

    @PostMapping
    public ResponseEntity<?> createTicket(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam(value = "resourceName", required = false, defaultValue = "") String resourceName,
            @RequestParam(value = "resourceId", required = false, defaultValue = "") String resourceId,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal OAuth2User principal) {
        
        System.out.println("===== CREATE TICKET REQUEST =====");
        System.out.println("Title: " + title);
        System.out.println("Description: " + description);
        System.out.println("ResourceName: " + resourceName);
        System.out.println("ResourceId: " + resourceId);
        System.out.println("Image: " + (image != null ? image.getOriginalFilename() : "none"));
        
        User user = getAuthenticatedUser(principal);
        if (user == null) {
            System.out.println("User authentication failed!");
            return ResponseEntity.status(401).body("Authentication required");
        }
        
        System.out.println("User: " + user.getName() + " (ID: " + user.getId() + ")");

        try {
            Ticket ticket = new Ticket();
            ticket.setTitle(title);
            ticket.setDescription(description);
            ticket.setResourceName(resourceName != null && !resourceName.isEmpty() ? resourceName : null);
            ticket.setResourceId(resourceId != null && !resourceId.isEmpty() ? resourceId : null);
            ticket.setCreatorId(user.getId());
            ticket.setCreatorName(user.getName());

            Ticket created = ticketService.createTicket(ticket);
            System.out.println("Ticket created with ID: " + created.getId());
            
            // Upload image if provided
            if (image != null && !image.isEmpty()) {
                try {
                    String imageUrl = ticketService.uploadTicketImage(created.getId(), image);
                    created.setImageUrl(imageUrl);
                    System.out.println("Image uploaded: " + imageUrl);
                } catch (Exception e) {
                    System.err.println("Failed to upload image: " + e.getMessage());
                    e.printStackTrace();
                }
            }

            System.out.println("===== TICKET CREATION SUCCESS =====");
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            System.err.println("===== TICKET CREATION FAILED =====");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to create ticket: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<?> uploadImage(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        try {
            String url = ticketService.uploadTicketImage(id, file);
            return ResponseEntity.ok(Map.of("imageUrl", url));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ticketService.updateTicketStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignTechnician(@PathVariable String id, @RequestBody Map<String, String> body) {
        String technicianId = body.get("technicianId");
        return ticketService.assignTechnician(id, technicianId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- Comments Endpoints ---

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getTicketComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable String id, @RequestBody Comment comment, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        comment.setAuthorId(user.getId());
        comment.setAuthorName(user.getName());
        
        return ResponseEntity.ok(ticketService.addComment(id, comment));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable String commentId, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        try {
            ticketService.deleteComment(commentId, user.getId(), user.getRole().name());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}
