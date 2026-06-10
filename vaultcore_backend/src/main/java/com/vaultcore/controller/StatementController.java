package com.vaultcore.controller;

import com.vaultcore.model.Account;
import com.vaultcore.model.Ledger;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.LedgerRepository;
import com.vaultcore.service.StatementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/statements")
@CrossOrigin(origins = "http://localhost:3000")
public class StatementController {

    @Autowired private StatementService   statementService;
    @Autowired private AccountRepository  accountRepository;

    @GetMapping("/monthly")
    public ResponseEntity<byte[]> getMonthlyStatement(
            @RequestParam String accountNumber,
            @RequestParam int    month,
            @RequestParam int    year) {

        // Validate account exists
        Optional<Account> accountOpt = accountRepository.findByAccountNumber(accountNumber);
        if (accountOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            byte[] pdf = statementService.generateMonthlyStatement(accountNumber, month, year);

            String filename = String.format("VaultCore_Statement_%s_%02d_%d.pdf",
                    accountNumber, month, year);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .body(pdf);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
