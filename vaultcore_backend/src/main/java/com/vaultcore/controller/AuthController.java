package com.vaultcore.controller;

import com.vaultcore.dto.JwtResponse;
import com.vaultcore.dto.LoginRequest;
import com.vaultcore.model.Account;
import com.vaultcore.model.User;
import com.vaultcore.repository.AccountRepository;
import com.vaultcore.repository.UserRepository;
import com.vaultcore.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(
        origins = "http://localhost:3000",
        allowedHeaders = "*",
        methods = { RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS }
)
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private UserRepository userRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Auth controller is reachable!");
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.getUsername() == null || loginRequest.getUsername().isBlank())
            return ResponseEntity.badRequest().body(err("Username is required"));
        if (loginRequest.getPassword() == null || loginRequest.getPassword().isBlank())
            return ResponseEntity.badRequest().body(err("Password is required"));

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername().trim(), loginRequest.getPassword()
                    )
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            String jwt          = jwtUtil.generateToken(loginRequest.getUsername().trim());
            String refreshToken = jwtUtil.generateRefreshToken(loginRequest.getUsername().trim());

            User user = userRepository.findByUsername(loginRequest.getUsername().trim())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // ✅ Auto-provision accounts on login if user has none (fixes existing users like ankita)
            if (accountRepository.countByUser_Id(user.getId()) == 0) {
                createDefaultAccounts(user);
            }

            return ResponseEntity.ok(new JwtResponse(
                    jwt, refreshToken, user.getId(), user.getUsername(), user.getRole()
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("Invalid username or password"));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("Account is disabled"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err("Login failed: " + e.getMessage()));
        }
    }

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getUsername() == null || user.getUsername().isBlank())
            return ResponseEntity.badRequest().body(err("Username is required"));
        if (user.getPassword() == null || user.getPassword().isBlank())
            return ResponseEntity.badRequest().body(err("Password is required"));
        if (user.getEmail() == null || user.getEmail().isBlank())
            return ResponseEntity.badRequest().body(err("Email is required"));
        if (user.getPassword().length() < 6)
            return ResponseEntity.badRequest().body(err("Password must be at least 6 characters"));
        if (!user.getEmail().contains("@"))
            return ResponseEntity.badRequest().body(err("Invalid email address"));

        try {
            if (userRepository.findByUsername(user.getUsername().trim()).isPresent())
                return ResponseEntity.badRequest().body(err("Username already exists"));
            if (userRepository.findByEmail(user.getEmail().trim()).isPresent())
                return ResponseEntity.badRequest().body(err("Email already registered"));

            user.setUsername(user.getUsername().trim());
            user.setEmail(user.getEmail().trim());
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRole("USER");

            User saved = userRepository.save(user);
            createDefaultAccounts(saved);   // ✅ Create SAVINGS + CHECKING immediately

            Map<String, Object> res = new HashMap<>();
            res.put("message", "Registration successful! Your Savings ($1,000) and Checking ($500) accounts are ready.");
            res.put("userId",   saved.getId());
            res.put("username", saved.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(res);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err("Registration failed: " + e.getMessage()));
        }
    }

    private void createDefaultAccounts(User user) {
        String uid    = String.valueOf(user.getId());
        String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Account savings = new Account();
        savings.setUser(user);
        savings.setAccountType("SAVINGS");
        savings.setAccountNumber("VC" + uid + "SAV" + suffix);
        savings.setBalance(new BigDecimal("1000.00"));
        accountRepository.save(savings);

        Account checking = new Account();
        checking.setUser(user);
        checking.setAccountType("CHECKING");
        checking.setAccountNumber("VC" + uid + "CHK" + suffix);
        checking.setBalance(new BigDecimal("500.00"));
        accountRepository.save(checking);
    }

    private Map<String, String> err(String msg) {
        return Map.of("message", msg);
    }
}
