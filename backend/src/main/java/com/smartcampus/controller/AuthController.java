package com.smartcampus.controller;

import com.smartcampus.model.Role;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(204).build(); // Return 204 No Content when not authenticated
        }
        
        String email = principal.getAttribute("email");        
        Optional<User> user = userRepository.findByEmail(email);
        
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body((User) null));
    }

    @PostMapping("/select-role")
    public ResponseEntity<?> selectRole(@AuthenticationPrincipal OAuth2User principal, @RequestBody Map<String, String> request) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String email = principal.getAttribute("email");
        String roleName = request.get("role");

        if (email == null || roleName == null) {
            return ResponseEntity.badRequest().body("Email and role are required");
        }

        Role role;
        try {
            role = Role.valueOf(roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid role");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole(role);
            userRepository.save(user);
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletRequest request) {
        try {
            request.getSession().invalidate();
            return ResponseEntity.ok().body(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.ok().body(Map.of("message", "Logout completed"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        // Simple hardcoded login for demo (in production, use proper password hashing)
        if ("sanayasuraweera0806@gmail.com".equals(email) && "Sanaya@0806".equals(password)) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                return ResponseEntity.ok(userOpt.get());
            } else {
                // Create a new user if not exists
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setName("Sanaya Suraweera");
                newUser.setRole(Role.ADMIN);
                userRepository.save(newUser);
                return ResponseEntity.ok(newUser);
            }
        }

        return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
    }
}
