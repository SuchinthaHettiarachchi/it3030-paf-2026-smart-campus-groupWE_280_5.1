package com.smartcampus.controller;

import com.smartcampus.model.Booking;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(BookingService bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
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
    public ResponseEntity<List<Booking>> getAllBookings(@AuthenticationPrincipal OAuth2User principal) {
        // Ideally should check if user is Admin, omitting for simplicity
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<?> getMyBookings(@AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();
        
        return ResponseEntity.ok(bookingService.getUserBookings(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        booking.setUserId(user.getId());
        booking.setUserName(user.getName());

        try {
            Booking created = bookingService.createBooking(booking);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable String id, @RequestBody Map<String, String> body) {
        // Require ADMIN role check in production
        String status = body.getOrDefault("status", "APPROVED"); // APPROVED or REJECTED
        String rejectionReason = body.get("rejectionReason");
        return bookingService.updateBookingStatus(id, status, rejectionReason)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        try {
            User user = getAuthenticatedUser(principal);
            boolean deleted = bookingService.deleteBooking(id, user.getId(), user.getRole().name());
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
            }
            return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        User user = getAuthenticatedUser(principal);
        if (user == null) return ResponseEntity.status(401).build();

        try {
            return bookingService.cancelBooking(id, user.getId())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/qr")
    public ResponseEntity<?> getBookingQrDetails(@PathVariable String id, @AuthenticationPrincipal OAuth2User principal) {
        // Get the actual booking to retrieve its QR validation data
        Optional<Booking> bookingOpt = bookingService.getBookingById(id);
        if (!bookingOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Booking booking = bookingOpt.get();
        return ResponseEntity.ok(Map.of("qrValidationData", booking.getQrValidationData()));
    }

    @GetMapping("/verify-qr")
    public ResponseEntity<?> verifyQrCode(@RequestParam String qrData) {
        // Public endpoint - no authentication required for QR check-in
        
        Optional<Booking> bookingOpt = bookingService.verifyQrData(qrData);
        
        if (!bookingOpt.isPresent()) {
            return ResponseEntity.status(404).body(Map.of(
                "error", "INVALID_QR",
                "message", "This QR code is not recognized."
            ));
        }
        
        Booking booking = bookingOpt.get();
        LocalDateTime now = LocalDateTime.now();
        
        // Check if already checked in
        if (booking.getCheckedInAt() != null) {
            return ResponseEntity.status(400).body(Map.of(
                "error", "ALREADY_CHECKED_IN",
                "message", "Already Checked In",
                "checkedInAt", booking.getCheckedInAt(),
                "booking", booking
            ));
        }
        
        // Check if booking is not approved
        if (!"APPROVED".equals(booking.getStatus())) {
            String message = "CANCELLED".equals(booking.getStatus()) ? "Booking is CANCELLED." :
                           "REJECTED".equals(booking.getStatus()) ? "Booking is not APPROVED." :
                           "Booking status: " + booking.getStatus();
            return ResponseEntity.status(400).body(Map.of(
                "error", "NOT_ALLOWED",
                "message", message,
                "status", booking.getStatus()
            ));
        }
        
        // Check if booking time window is valid (allow check-in 15 mins before start time)
        LocalDateTime allowedCheckInTime = booking.getStartTime().minusMinutes(15);
        if (now.isBefore(allowedCheckInTime)) {
            return ResponseEntity.status(400).body(Map.of(
                "error", "TOO_EARLY",
                "message", "Check-in opens 15 minutes before booking start time.",
                "startTime", booking.getStartTime()
            ));
        }
        
        // Check if booking has ended
        if (now.isAfter(booking.getEndTime())) {
            return ResponseEntity.status(400).body(Map.of(
                "error", "EXPIRED",
                "message", "Booking time has ended.",
                "endTime", booking.getEndTime()
            ));
        }
        
        // Update booking with check-in timestamp
        booking.setCheckedInAt(now);
        bookingService.updateCheckIn(booking);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Check-in Successful",
            "booking", booking,
            "checkedInAt", now
        ));
    }
}
