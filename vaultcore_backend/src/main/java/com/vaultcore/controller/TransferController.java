package com.vaultcore.controller;

import com.vaultcore.dto.TransferRequest;
import com.vaultcore.security.CustomUserDetails;
import com.vaultcore.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ✅ PRODUCTION: Handles 2FA flow for high-value transfers.
 *
 * Transfer flow:
 *
 * Normal transfer (amount ≤ threshold):
 *   POST /api/transfers { fromAccount, toAccount, amount, description }
 *   → 200 { message: "Transfer successful", transactionId: "TXN-..." }
 *
 * High-value transfer (amount > threshold, first attempt):
 *   POST /api/transfers { fromAccount, toAccount, amount, description }
 *   → 202 { requires2FA: true, challengeId: "2FA-...", message: "OTP sent to your phone/email" }
 *
 * High-value transfer (second attempt with OTP):
 *   POST /api/transfers { fromAccount, toAccount, amount, description, challengeId, otpCode }
 *   → 200 { message: "Transfer successful", transactionId: "TXN-..." }
 *   OR → 400 { message: "Invalid OTP code. Transfer rejected." }
 */
@RestController
@RequestMapping("/api/transfers")
@CrossOrigin(origins = "http://localhost:3000")
public class TransferController {

    @Autowired
    private TransferService transferService;

    @PostMapping
    public ResponseEntity<?> transferMoney(
            @RequestBody TransferRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String username = userDetails != null ? userDetails.getUsername() : "unknown";

        try {
            String txnId = transferService.transferMoney(request, username);
            return ResponseEntity.ok(Map.of(
                    "message",       "Transfer successful!",
                    "transactionId", txnId,
                    "requires2FA",   false
            ));

        } catch (TransferService.TwoFactorRequiredException e) {
            // ✅ 202 Accepted — client must complete 2FA before transfer can proceed
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                    "requires2FA",  true,
                    "challengeId",  e.getChallengeId(),
                    "message",      e.getMessage(),
                    "hint",         "Check your backend console for the mock OTP (fraud.sms-mock-enabled=true)"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message",     "Transfer failed: " + e.getMessage(),
                    "requires2FA", false
            ));
        }
    }
}
