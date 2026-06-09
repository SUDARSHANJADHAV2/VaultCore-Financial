package com.vaultcore.controller;

import com.vaultcore.model.AuditLog;
import com.vaultcore.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Week 4 — Audit Log REST endpoint
 *
 * GET /api/audit         — Returns all audit logs (ADMIN only)
 * GET /api/audit/me      — Returns audit logs for the currently logged-in user
 *
 * Logs are written by AuditAspect (AspectJ @AfterReturning / @AfterThrowing).
 */
@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "http://localhost:3000")
public class AuditController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * GET /api/audit
     * Returns all audit log entries, newest first.
     * Restricted to ADMIN role.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(logs);
    }

    /**
     * GET /api/audit/me
     * Returns audit log entries for the currently authenticated user.
     * Any authenticated user can call this (shows their own activity).
     */
    @GetMapping("/me")
    public ResponseEntity<List<AuditLog>> getMyLogs(
            @RequestParam(defaultValue = "50") int limit) {

        // Extract username from Security context
        String username = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();

        List<AuditLog> logs = auditLogRepository
                .findTop50ByUsernameOrderByCreatedAtDesc(username);
        return ResponseEntity.ok(logs);
    }
}
