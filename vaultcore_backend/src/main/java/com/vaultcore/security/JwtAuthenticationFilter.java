package com.vaultcore.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path   = request.getRequestURI();
        String method = request.getMethod();

        return path.startsWith("/api/auth/")
                || path.startsWith("/api/public/")
                || HttpMethod.OPTIONS.matches(method)
                || path.startsWith("/actuator/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        String username = null;
        String jwt      = null;

        // ✅ Step 1: Extract JWT
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.error("JWT extraction failed: " + e.getMessage());
                sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                        "Invalid or expired token. Please login again.");
                return;
            }
        }

        // ✅ Step 2: No token on a protected route → 401
        if (jwt == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Authorization token is required. Please login.");
            return;
        }

        // ✅ Step 3: Validate token and set Spring Security context
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                            "Token validation failed. Please login again.");
                    return;
                }

            } catch (Exception e) {
                logger.error("Authentication error: " + e.getMessage());
                sendError(response, HttpServletResponse.SC_UNAUTHORIZED,
                        "Authentication failed. Please login again.");
                return;
            }
        }

        chain.doFilter(request, response);
    }


    private void sendError(HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\": \"" + message + "\"}");
    }
}
