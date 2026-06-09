package com.vaultcore.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransferRequest {
    private String fromAccount;
    private String toAccount;
    private BigDecimal amount;
    private String description;

    // ✅ Optional — populated when user submits OTP after 2FA challenge
    private String challengeId;
    private String otpCode;
}
