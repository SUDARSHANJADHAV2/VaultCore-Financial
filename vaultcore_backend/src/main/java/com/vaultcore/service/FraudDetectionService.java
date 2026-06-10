package com.vaultcore.service;

import com.vaultcore.dto.TransferRequest;
import com.vaultcore.model.TwoFactorChallenge;
import com.vaultcore.repository.TwoFactorChallengeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PRODUCTION FEATURE — Fraud Detection Middleware (Week 2 requirement)
 *
 * Implements:
 * 1. Configurable threshold check (fraud.threshold in application.properties)
 * 2. When triggered → creates a TwoFactorChallenge with a 6-digit OTP
 * 3. Mock SMS/Email notification (logs to console, ready for real provider swap)
 * 4. OTP verification with expiry (5 minutes)
 *
 * Integration flow:
 *   Transfer request arrives
 *     → FraudDetectionService.checkAndChallenge()
 *       → amount <= threshold: returns null (proceed)
 *       → amount >  threshold: creates challenge, sends mock OTP, returns challengeId
 *   Frontend receives {requires2FA: true, challengeId: "..."}
 *   User enters OTP
 *   Transfer request re-submitted with {challengeId, otpCode}
 *     → FraudDetectionService.verifyChallenge() called first
 *       → OTP valid: proceeds with transfer
 *       → OTP invalid/expired: rejects
 */
@Service
public class FraudDetectionService {

    private static final Logger log = LoggerFactory.getLogger(FraudDetectionService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${fraud.threshold:10000}")
    private BigDecimal fraudThreshold;

    @Value("${fraud.otp.expiry.minutes:5}")
    private int otpExpiryMinutes;

    @Value("${fraud.sms-mock-enabled:true}")
    private boolean smsMockEnabled;

    @Autowired
    private TwoFactorChallengeRepository challengeRepository;

    /**
     * Checks if a transfer is suspicious.
     * Returns null if safe to proceed.
     * Returns challengeId if 2FA is required.
     */
    public String checkAndChallenge(TransferRequest request, String username) {
        if (!isSuspicious(request)) {
            return null;    // Safe — no 2FA needed
        }

        // ✅ Amount exceeds threshold → create 2FA challenge
        String otp         = generateOtp();
        String challengeId = "2FA-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        TwoFactorChallenge challenge = new TwoFactorChallenge();
        challenge.setChallengeId(challengeId);
        challenge.setUsername(username);
        challenge.setOtpCode(otp);
        challenge.setFromAccount(request.getFromAccount());
        challenge.setToAccount(request.getToAccount());
        challenge.setAmount(request.getAmount());
        challenge.setDescription(request.getDescription());
        challenge.setStatus(TwoFactorChallenge.ChallengeStatus.PENDING);
        challenge.setCreatedAt(LocalDateTime.now());
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        challengeRepository.save(challenge);

        // ✅ Mock SMS/Email — replace with Twilio / SendGrid in production
        sendMockNotification(username, otp, request.getAmount());

        log.warn("🚨 FRAUD ALERT: Transfer of ${} by {} flagged. Challenge: {} OTP: {}",
                request.getAmount(), username, challengeId, otp);

        return challengeId;
    }

    /**
     * Verifies OTP for a 2FA challenge.
     * Returns the saved TwoFactorChallenge if valid (so TransferService can re-use the transfer data).
     * Throws exception if invalid or expired.
     */
    public TwoFactorChallenge verifyChallenge(String challengeId, String otpCode) throws Exception {
        TwoFactorChallenge challenge = challengeRepository
                .findByChallengeId(challengeId)
                .orElseThrow(() -> new Exception("Invalid 2FA challenge ID"));

        if (challenge.getStatus() != TwoFactorChallenge.ChallengeStatus.PENDING) {
            throw new Exception("2FA challenge is no longer valid (status: " + challenge.getStatus() + ")");
        }

        if (challenge.isExpired()) {
            challenge.setStatus(TwoFactorChallenge.ChallengeStatus.EXPIRED);
            challengeRepository.save(challenge);
            throw new Exception("2FA OTP has expired. Please initiate the transfer again.");
        }

        if (!challenge.getOtpCode().equals(otpCode)) {
            challenge.setStatus(TwoFactorChallenge.ChallengeStatus.FAILED);
            challengeRepository.save(challenge);
            throw new Exception("Invalid OTP code. Transfer rejected.");
        }

        // ✅ Valid — mark as verified
        challenge.setStatus(TwoFactorChallenge.ChallengeStatus.VERIFIED);
        challenge.setVerifiedAt(LocalDateTime.now());
        challengeRepository.save(challenge);

        log.info("✅ 2FA verified for challenge {} by {}", challengeId, challenge.getUsername());
        return challenge;
    }

    public boolean isSuspicious(TransferRequest request) {
        return request.getAmount() != null &&
                request.getAmount().compareTo(fraudThreshold) > 0;
    }

    /** Generates a cryptographically secure 6-digit OTP */
    private String generateOtp() {
        int otp = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * ✅ Mock SMS/Email notification.
     * In production: replace with Twilio SMS or SendGrid email client.
     * The log output simulates what a real notification would contain.
     */
    private void sendMockNotification(String username, String otp, BigDecimal amount) {
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("📱 [MOCK SMS] To: {} (+91-XXXXXXXXXX)", username);
        log.info("   VaultCore Security Alert!");
        log.info("   Large transfer of ${} detected.", amount);
        log.info("   Your OTP is: {} (valid for {} mins)", otp, otpExpiryMinutes);
        log.info("   If you did not initiate this, call 1800-VAULT immediately.");
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        log.info("📧 [MOCK EMAIL] To: {}@vaultcore.com", username);
        log.info("   Subject: Action Required — Large Transfer OTP");
        log.info("   OTP: {} | Amount: ${} | Expires: {} mins", otp, amount, otpExpiryMinutes);
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
}
