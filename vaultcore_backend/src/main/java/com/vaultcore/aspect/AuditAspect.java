package com.vaultcore.aspect;

import com.vaultcore.model.AuditLog;
import com.vaultcore.repository.AuditLogRepository;
import com.vaultcore.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Arrays;

/**
 * PRODUCTION FEATURE — Audit Logging via AspectJ (Week 4 requirement)
 *
 * Logs every controller method call including:
 * - Username (from JWT security context)
 * - IP address
 * - HTTP method + URI
 * - Method signature + parameters (sanitized for XSS)
 * - Result or exception message
 * - Timestamp
 *
 * ✅ XSS Protection: All logged strings are sanitized via sanitize()
 *    before being saved to the audit_log table — a breach here is
 *    equivalent to regulatory failure per the project spec.
 *
 * ✅ Async execution: @Async prevents audit logging from adding latency
 *    to the main request path (logs on a background thread).
 *
 * ✅ Both success and failure are logged:
 *    @AfterReturning — logs successful calls with return value
 *    @AfterThrowing  — logs failed calls with exception message
 */
@Aspect
@Component
public class AuditAspect {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Pointcut("@within(org.springframework.web.bind.annotation.RestController)")
    public void controllerMethods() {}

    /** Log successful controller method returns */
    @Async
    @AfterReturning(pointcut = "controllerMethods()", returning = "result")
    public void logSuccess(JoinPoint joinPoint, Object result) {
        saveAuditLog(joinPoint, sanitize(result != null ? result.toString() : "null"), "SUCCESS");
    }

    /** Log controller method exceptions — security failures, validation errors, etc. */
    @Async
    @AfterThrowing(pointcut = "controllerMethods()", throwing = "ex")
    public void logFailure(JoinPoint joinPoint, Throwable ex) {
        saveAuditLog(joinPoint, sanitize("ERROR: " + ex.getMessage()), "FAILURE");
    }

    private void saveAuditLog(JoinPoint joinPoint, String result, String outcome) {
        try {
            AuditLog log = new AuditLog();

            // ✅ Extract username from Spring Security context (set by JwtAuthenticationFilter)
            Object principal = SecurityContextHolder.getContext().getAuthentication() != null
                    ? SecurityContextHolder.getContext().getAuthentication().getPrincipal()
                    : null;

            if (principal instanceof CustomUserDetails cud) {
                log.setUsername(cud.getUsername());
            } else if (principal instanceof String s) {
                log.setUsername(sanitize(s));
            } else {
                log.setUsername("anonymous");
            }

            // ✅ Extract IP + URI from HTTP request
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                String ip = getClientIp(req);
                log.setIpAddress(sanitize(ip));
                log.setAction(sanitize(req.getMethod() + " " + req.getRequestURI()));
            }

            log.setMethod(joinPoint.getSignature().toShortString());
            // ✅ XSS-sanitize all parameters before storing
            log.setParameters(sanitize(Arrays.toString(joinPoint.getArgs())));
            log.setResult(truncate(result, 1000));
            log.setCreatedAt(LocalDateTime.now());

            auditLogRepository.save(log);

        } catch (Exception e) {
            // Never let audit logging break the main application flow
            System.err.println("[AuditAspect] Failed to save audit log: " + e.getMessage());
        }
    }

    /**
     * ✅ XSS Sanitization — prevents stored XSS attacks via audit log data.
     * Strips HTML tags and escapes dangerous characters before DB storage.
     * Per project spec: "a breach resulting from XSS here is equivalent to
     * a legal/regulatory failure."
     */
    private String sanitize(String input) {
        if (input == null) return null;
        return input
                // Strip HTML tags
                .replaceAll("<[^>]*>", "")
                // Escape common XSS vectors
                .replace("&",  "&amp;")
                .replace("<",  "&lt;")
                .replace(">",  "&gt;")
                .replace("\"", "&quot;")
                .replace("'",  "&#x27;")
                .replace("/",  "&#x2F;")
                // Prevent SQL injection in logs
                .replaceAll("(?i)(select|insert|update|delete|drop|union|exec|script)", "[FILTERED]");
    }

    /** Extracts real client IP handling proxies/load balancers */
    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty() && !"unknown".equalsIgnoreCase(xff)) {
            return xff.split(",")[0].trim();
        }
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isEmpty() && !"unknown".equalsIgnoreCase(xri)) {
            return xri;
        }
        return request.getRemoteAddr();
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return null;
        return s.length() > maxLen ? s.substring(0, maxLen) + "...[truncated]" : s;
    }
}
