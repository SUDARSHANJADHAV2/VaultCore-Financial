package com.vaultcore.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Stores pending 2FA challenges triggered by FraudDetectionService.
 * When a transfer exceeds the fraud threshold, a TwoFactorChallenge is created
 * with a 6-digit OTP. The transfer is blocked until the OTP is verified.
 */
@Entity
@Table(name = "two_factor_challenges")
@Data
public class TwoFactorChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_id", unique = true, nullable = false)
    private String challengeId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "otp_code", nullable = false)
    private String otpCode;

    // The original transfer request fields — stored for re-execution after 2FA passes
    @Column(name = "from_account")
    private String fromAccount;

    @Column(name = "to_account")
    private String toAccount;

    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ChallengeStatus status = ChallengeStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    public enum ChallengeStatus { PENDING, VERIFIED, EXPIRED, FAILED }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
