package com.vaultcore.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
@Data
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_number", unique = true, nullable = false)
    private String accountNumber;

    // ✅ FIX: @JsonIgnoreProperties prevents circular JSON serialization (User → Accounts → User → ...)
    // We keep "id" and "username" exposed so frontend can show recipient name in Transfer dropdown
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password", "email", "phone", "role", "createdAt", "hibernateLazyInitializer"})
    private User user;

    @Column(name = "account_type")
    private String accountType;

    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
