package com.vaultcore.model;

import jakarta.persistence.*;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "ledger",
        uniqueConstraints = {
                // ✅ FIX: Use exact DB column name "entry_type" (snake_case as stored in MySQL)
                // Hibernate naming strategy converts Java field "entryType" → DB column "entry_type"
                // @UniqueConstraint must use the DB column name, NOT the Java field name
                @UniqueConstraint(
                        name = "uq_ledger_txn_entry",
                        columnNames = {"transaction_id", "entry_type"}
                )
        },
        indexes = {
                @Index(name = "idx_ledger_txn_id",      columnList = "transaction_id"),
                @Index(name = "idx_ledger_account_ref",  columnList = "account_ref"),
                @Index(name = "idx_ledger_created_at",   columnList = "created_at")
        }
)
@Getter
public class Ledger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", nullable = false, updatable = false, length = 40)
    private String transactionId;

    @Column(name = "account_ref", nullable = false, updatable = false)
    private String accountRef;

    // ✅ Explicitly set column name to "entry_type" so Hibernate knows exactly what to look for
    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, updatable = false)
    private EntryType entryType;

    @Column(nullable = false, updatable = false,
            columnDefinition = "DECIMAL(19,4) CHECK (amount > 0)")
    private BigDecimal amount;

    @Column(name = "counterpart_account", updatable = false)
    private String counterpartAccount;

    @Column(updatable = false)
    private String description;

    @Column(updatable = false)
    private String type;

    @Column(name = "balance_after", updatable = false)
    private BigDecimal balanceAfter;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum EntryType { DEBIT, CREDIT }

    Ledger() {}

    public static Ledger debit(String txnId, String fromAccount, String toAccount,
                               BigDecimal amount, BigDecimal balanceAfter, String description) {
        Ledger e = new Ledger();
        e.transactionId      = txnId;
        e.accountRef         = fromAccount;
        e.counterpartAccount = toAccount;
        e.entryType          = EntryType.DEBIT;
        e.amount             = amount;
        e.balanceAfter       = balanceAfter;
        e.description        = description;
        e.type               = "TRANSFER";
        e.createdAt          = LocalDateTime.now();
        return e;
    }

    public static Ledger credit(String txnId, String toAccount, String fromAccount,
                                BigDecimal amount, BigDecimal balanceAfter, String description) {
        Ledger e = new Ledger();
        e.transactionId      = txnId;
        e.accountRef         = toAccount;
        e.counterpartAccount = fromAccount;
        e.entryType          = EntryType.CREDIT;
        e.amount             = amount;
        e.balanceAfter       = balanceAfter;
        e.description        = description;
        e.type               = "TRANSFER";
        e.createdAt          = LocalDateTime.now();
        return e;
    }

    @PreUpdate
    public void onUpdate() {
        throw new IllegalStateException(
                "Ledger entries are IMMUTABLE. Transaction ID: " + transactionId + " cannot be modified."
        );
    }

    @PreRemove
    public void onRemove() {
        throw new IllegalStateException(
                "Ledger entries are IMMUTABLE. Transaction ID: " + transactionId + " cannot be deleted."
        );
    }
}