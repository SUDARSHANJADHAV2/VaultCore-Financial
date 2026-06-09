package com.vaultcore.dto;

// ✅ FIXED: Added userId field so frontend can store it in localStorage
// Previously missing → Dashboard/Transfer broke because userId was always null
public class JwtResponse {

    private String token;
    private String refreshToken;
    private Long userId;        // ✅ ADDED - required by frontend Login.js
    private String username;
    private String role;

    public JwtResponse(String token, String refreshToken, Long userId, String username, String role) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.username = username;
        this.role = role;
    }

    public String getToken()        { return token; }
    public String getRefreshToken() { return refreshToken; }
    public Long getUserId()         { return userId; }
    public String getUsername()     { return username; }
    public String getRole()         { return role; }
}
