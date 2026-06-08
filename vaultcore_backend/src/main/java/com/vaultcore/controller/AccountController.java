package com.vaultcore.controller;

import com.vaultcore.model.Account;
import com.vaultcore.model.User;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.UserRepository;
import com.vaultcore.service.TransferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "http://localhost:3000")
public class AccountController {

    @Autowired private AccountRepository accountRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TransferService transferService;

    /** GET /api/accounts/user/{userId} — logged-in user's own accounts */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Account>> getUserAccounts(@PathVariable Long userId) {
        List<Account> accounts = accountRepository.findByUser_Id(userId);
        if (accounts.isEmpty()) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) accounts = createDefaultAccounts(user);
        }
        return ResponseEntity.ok(accounts);
    }

    /** GET /api/accounts/others/{userId} — all accounts except logged-in user */
    @GetMapping("/others/{userId}")
    public ResponseEntity<List<Account>> getOtherAccounts(@PathVariable Long userId) {
        return ResponseEntity.ok(accountRepository.findAllExceptUser(userId));
    }

    /** POST /api/accounts/provision/{userId} — create default accounts for existing users */
    @PostMapping("/provision/{userId}")
    public ResponseEntity<?> provisionAccounts(@PathVariable Long userId) {
        if (accountRepository.countByUser_Id(userId) > 0) {
            return ResponseEntity.ok(Map.of(
                    "message", "Accounts already exist",
                    "accounts", accountRepository.findByUser_Id(userId)
            ));
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        return ResponseEntity.ok(Map.of(
                "message", "Accounts created successfully!",
                "accounts", createDefaultAccounts(user)
        ));
    }

    /**
     * ✅ GET /api/accounts/{accountNumber}/balance
     *
     * PRODUCTION FEATURE — Virtual Threads (Java 21, Week 2 requirement)
     *
     * This endpoint delegates to TransferService.getBalance() which uses
     * Executors.newVirtualThreadPerTaskExecutor() internally.
     *
     * Virtual threads are extremely lightweight (few KB of memory vs MB for OS threads),
     * so this endpoint can handle thousands of concurrent requests without degradation.
     * The spring.threads.virtual.enabled=true in application.properties also makes
     * all Tomcat request threads virtual — this endpoint stacks on top of that.
     */
    @GetMapping("/{accountNumber}/balance")
    public ResponseEntity<Map<String, Object>> getBalance(@PathVariable String accountNumber) {
        long start = System.currentTimeMillis();

        BigDecimal balance = transferService.getBalance(accountNumber);

        long elapsed = System.currentTimeMillis() - start;
        return ResponseEntity.ok(Map.of(
                "accountNumber", accountNumber,
                "balance",       balance,
                "responseTimeMs", elapsed,
                "threadType",    Thread.currentThread().isVirtual() ? "VirtualThread" : "PlatformThread"
        ));
    }

    /** GET /api/accounts/{accountNumber} */
    @GetMapping("/{accountNumber}")
    public ResponseEntity<Account> getAccount(@PathVariable String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/accounts/{accountNumber}/history — transaction history */
    @GetMapping("/{accountNumber}/history")
    public ResponseEntity<?> getTransactionHistory(@PathVariable String accountNumber) {
        return ResponseEntity.ok(transferService.getTransactionHistory(accountNumber));
    }

    private List<Account> createDefaultAccounts(User user) {
        String uid = String.valueOf(user.getId());
        String sfx = UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Account sav = new Account();
        sav.setUser(user); sav.setAccountType("SAVINGS");
        sav.setAccountNumber("VC" + uid + "SAV" + sfx);
        sav.setBalance(new BigDecimal("1000.00"));
        accountRepository.save(sav);

        Account chk = new Account();
        chk.setUser(user); chk.setAccountType("CHECKING");
        chk.setAccountNumber("VC" + uid + "CHK" + sfx);
        chk.setBalance(new BigDecimal("500.00"));
        accountRepository.save(chk);

        return accountRepository.findByUser_Id(user.getId());
    }
}
