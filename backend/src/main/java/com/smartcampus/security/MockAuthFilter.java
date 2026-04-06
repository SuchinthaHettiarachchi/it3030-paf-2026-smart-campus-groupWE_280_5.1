package com.smartcampus.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Mock authentication filter for development.
 * Injects a fake authenticated user into every request.
 *
 * TODO: Remove this when Chanuka integrates real OAuth2/JWT auth.
 *
 * You can override the mock user by sending these headers:
 *   X-Mock-User-Id:    UUID
 *   X-Mock-User-Email:  email
 *   X-Mock-User-Roles:  comma-separated roles (e.g. "USER,ADMIN")
 */
@Component
public class MockAuthFilter extends OncePerRequestFilter {

    private static final UUID DEFAULT_USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String DEFAULT_EMAIL = "dev@smartcampus.lk";
    private static final List<String> DEFAULT_ROLES = List.of("USER", "ADMIN", "TECHNICIAN");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            UUID userId = DEFAULT_USER_ID;
            String email = DEFAULT_EMAIL;
            List<String> roles = DEFAULT_ROLES;

            // Allow overriding via headers for testing different users/roles
            String headerUserId = request.getHeader("X-Mock-User-Id");
            String headerEmail = request.getHeader("X-Mock-User-Email");
            String headerRoles = request.getHeader("X-Mock-User-Roles");

            if (headerUserId != null) {
                userId = UUID.fromString(headerUserId);
            }
            if (headerEmail != null) {
                email = headerEmail;
            }
            if (headerRoles != null) {
                roles = List.of(headerRoles.split(","));
            }

            AppUserDetails userDetails = new AppUserDetails(userId, email, roles);

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
