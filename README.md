# 🏦 VaultCore Financial

> **Full-Stack Banking Application** — Spring Boot 3.1.5 · React 18 · MySQL 8  
> All monetary values in **Indian Rupees ₹ (INR)**

| | |
|---|---|
| **Version** | 1.0.0 (Week 4) |
| **Backend** | Spring Boot 3.1.5 · Java 21 |
| **Frontend** | React 18 · Bootstrap 5 |
| **Database** | MySQL 8.0.45 |
| **API** | http://localhost:8081 |
| **UI** | http://localhost:3000 |
| **Currency** | Indian Rupees ₹ (INR / en-IN) |

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Feature Summary by Week](#feature-summary-by-week)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Prerequisites](#-prerequisites)
- [Setup & Installation](#-setup--installation)
- [API Endpoints](#-api-endpoints)
- [Key Features](#-key-features)
- [Security Notes](#-security-notes)
- [Troubleshooting](#-troubleshooting)
- [Quick-Start Checklist](#-quick-start-checklist)

---

## 📖 Project Overview

VaultCore Financial is a full-stack banking simulation application built across four development weeks. It demonstrates production-grade patterns including:

- **Double-entry ledger** accounting (immutable, trigger-protected)
- **JWT-based authentication** with Spring Security
- **Fraud detection** with configurable threshold and 2FA OTP challenge flow
- **Real-time stock portfolio** visualization with latency monitoring
- **AspectJ audit logging** via `@Around` AOP advice
- **PDF statement generation** using iText 7

> All monetary values use the `en-IN` locale for proper Indian number formatting (e.g., ₹1,00,000.00 = One Lakh)

---

## Feature Summary by Week

| Week | Theme | Features Delivered |
|------|-------|-------------------|
| **Week 1** | Core Banking | User auth (JWT), account management, double-entry ledger, fund transfers |
| **Week 2** | Fraud Detection | Configurable threshold, OTP 2FA challenge flow, `TwoFactorChallenge` table, mock SMS |
| **Week 3** | Trading & APIs | Mock Stock REST service, live Portfolio dashboard, Recharts visualization, <300ms latency monitor |
| **Week 4** | Audit & Compliance | AspectJ `AuditAspect` (`@Around`), `audit_log` table, AuditLog UI, iText 7 PDF statement generator |

---

## 🏗 Architecture

### Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| Backend Framework | Spring Boot 3.1.5 | Java 21, virtual threads (`spring.threads.virtual.enabled=true`) |
| Security | Spring Security + JWT | jjwt 0.11.5, stateless sessions, BCrypt password hashing |
| Persistence | Spring Data JPA | Hibernate 6, MySQL dialect, HikariCP pool (max 20) |
| AOP / Audit | Spring AOP (AspectJ) | `@Around` advice on all controllers, async DB logging |
| PDF Generation | iText 7.2.5 | `kernel` + `layout` + `io` modules, password-protected output |
| Frontend Framework | React 18 | React Router v6, Bootstrap 5, Axios |
| Charts | Recharts | `AreaChart` (stock prices), `LineChart` (latency monitor) |
| Database | MySQL 8.0.45 | Immutable ledger triggers, CHECK constraints |

### Backend Package Structure

```
com.vaultcore/
├── VaultcoreApplication.java
├── aspect/
│   └── AuditAspect.java               # @Around all controllers → audit_log
├── config/
│   └── CorsConfig.java                # CORS: http://localhost:3000
├── controller/
│   ├── AuthController.java            # POST /api/auth/login|register
│   ├── AccountController.java         # GET  /api/accounts/user/{userId}
│   ├── TransferController.java        # POST /api/transfers  (2FA flow)
│   ├── StockController.java           # GET  /api/stocks  /api/stocks/{symbol}
│   ├── StatementController.java       # GET  /api/statements/monthly → PDF
│   └── AuditController.java           # GET  /api/audit
├── service/
│   ├── TransferService.java           # Double-entry, 2FA, virtual threads
│   ├── FraudDetectionService.java     # Threshold check, OTP generation
│   ├── StatementService.java          # iText 7 PDF builder
│   ├── StockService.java              # Mock price generation
│   └── CustomUserDetailsService.java
├── security/
│   ├── SecurityConfig.java
│   ├── JwtUtil.java
│   └── JwtAuthenticationFilter.java
├── model/        Account · Ledger · User · TwoFactorChallenge · AuditLog
├── repository/   (Spring Data JPA interfaces)
└── dto/          LoginRequest · JwtResponse · TransferRequest
```

### Frontend Component Structure

```
src/
├── App.js                    # Router + auth guard
├── config/api.js             # Base URLs (localhost:8081/api)
└── components/
    ├── Login.js              # JWT login + registration
    ├── Navbar.js             # Navigation + logout
    ├── Dashboard.js          # Account balances (₹ INR)
    ├── Transfer.js           # Fund transfer + 2FA OTP modal
    ├── Portfolio.js          # Live stocks, Recharts, latency badge
    ├── TransactionHistory.js # Ledger view, filters
    ├── MonthlyStatement.js   # PDF download (₹ INR)
    └── AuditLog.js           # Admin audit trail viewer
```

---

## 🗄 Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Authentication — username, BCrypt password, email, role (`USER`/`ADMIN`) |
| `accounts` | Bank accounts — `account_number`, `balance DECIMAL(19,4)`, `account_type` (`SAVINGS`/`CHECKING`) |
| `ledger` | Immutable double-entry journal — `DEBIT`/`CREDIT` pairs per `transaction_id`, UPDATE/DELETE blocked by triggers |
| `two_factor_challenges` | OTP challenges for high-value transfers — status ENUM (`PENDING`/`VERIFIED`/`EXPIRED`/`FAILED`), 5-min expiry |
| `audit_log` | AspectJ AOP trace — username, action, method, parameters, result, ip_address |

### Key Constraints & Triggers

- `accounts.balance` — `CHECK (balance >= 0)` prevents overdraft at DB level
- `ledger.amount` — `CHECK (amount > 0)` positive-only amounts
- `ledger` — `UNIQUE (transaction_id, entry_type)` — one DEBIT + one CREDIT per transaction
- `prevent_ledger_update` trigger — `SIGNAL SQLSTATE '45000'` on any `UPDATE`
- `prevent_ledger_delete` trigger — `SIGNAL SQLSTATE '45000'` on any `DELETE`

### Sample Users

> Password for all sample users: **`password`**

| Username | Email | Role | Accounts |
|----------|-------|------|----------|
| `john_doe` | john@example.com | USER | ACC001 (₹5,000) · ACC002 (₹2,500) |
| `jane_smith` | jane@example.com | USER | ACC003 (₹10,000) · ACC004 (₹3,000) |
| `admin` | admin@vaultcore.com | ADMIN | — |

---

## ✅ Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Java JDK | 21+ | Virtual threads required |
| Maven | 3.8+ | Or use included `./mvnw` wrapper |
| MySQL | 8.0.45 | Database: `vaultcore_db` |
| Node.js | 18+ | For React frontend |
| npm | 9+ | Package manager |

---

## 🚀 Setup & Installation

### 1. Database Setup

```sql
CREATE DATABASE vaultcore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vaultcore_user'@'localhost' IDENTIFIED BY 'VaultCore@2026';
GRANT ALL PRIVILEGES ON vaultcore_db.* TO 'vaultcore_user'@'localhost';
FLUSH PRIVILEGES;
```

Then run the schema:

```bash
mysql -u vaultcore_user -p vaultcore_db < schema.sql
```

### 2. Backend Setup

```bash
cd vaultcore_backend
./mvnw spring-boot:run
# Windows: mvnw.cmd spring-boot:run
```

API starts at **http://localhost:8081**

#### Key `application.properties` Values

| Property | Default | Notes |
|----------|---------|-------|
| `server.port` | `8081` | |
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/vaultcore_db` | |
| `spring.datasource.username` | `vaultcore_user` | |
| `spring.datasource.password` | `VaultCore@2026` | Change in production |
| `fraud.threshold` | `10000` | Transfers > ₹10,000 trigger 2FA |
| `fraud.otp.expiry.minutes` | `5` | OTP validity window |
| `fraud.sms-mock-enabled` | `true` | OTP printed to console |
| `jwt.secret` | *(hardcoded)* | Use env var in production |
| `jwt.expiration` | `86400000` | 24 hours in ms |
| `spring.threads.virtual.enabled` | `true` | Java 21 virtual threads |
| `spring.jackson.time-zone` | `Asia/Kolkata` | |

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

UI starts at **http://localhost:3000**

> Ensure the backend is running first. All API calls proxy to `http://localhost:8081/api` (configured in `src/config/api.js`).

---

## 📡 API Endpoints

All endpoints except `/api/auth/**` require:
```
Authorization: Bearer <JWT>
```

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login → returns JWT token, userId, role |
| `POST` | `/api/auth/register` | Register new user (USER role) |

### Accounts — `/api/accounts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/accounts/user/{userId}` | List all accounts for a user with balances (₹ INR) |

### Transfers — `/api/transfers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/transfers` | Transfer funds — returns `200` (success), `202` (2FA required), `400` (error) |

**Request body:**
```json
{
  "fromAccount": "ACC001",
  "toAccount": "ACC002",
  "amount": 5000,
  "description": "Rent payment",
  "challengeId": "(only for 2FA step 2)",
  "otpCode": "(only for 2FA step 2)"
}
```

**2FA Flow:**
1. POST transfer with `amount > ₹10,000`
2. Receive `HTTP 202` with `{ requires2FA: true, challengeId: "2FA-..." }`
3. Check backend console for mock OTP (when `fraud.sms-mock-enabled=true`)
4. Re-POST with same fields + `challengeId` + `otpCode`

### Stocks — `/api/stocks`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stocks` | All stocks with current prices (₹ INR) |
| `GET` | `/api/stocks/{symbol}` | Single stock price + `responseTime` (for latency check) |

### Statements — `/api/statements`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/statements/monthly` | Generate iText 7 PDF. Params: `accountNumber`, `month`, `year`. Returns `application/pdf` |

### Audit Log — `/api/audit`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/audit` | All audit log entries — ADMIN only |

---

## 🔍 Key Features

### Double-Entry Ledger (Immutable)

Every transfer creates exactly two ledger rows sharing the same `transaction_id`:
- **DEBIT** on the sender's account
- **CREDIT** on the receiver's account

MySQL triggers block all `UPDATE` and `DELETE` on the `ledger` table. The `UNIQUE (transaction_id, entry_type)` constraint prevents duplicate entries.

### Fraud Detection & 2FA

- Threshold configurable via `fraud.threshold` (default ₹10,000)
- Any transfer exceeding the threshold generates a 6-digit OTP
- OTP stored in `two_factor_challenges` table, expires in 5 minutes
- Mock mode logs OTP to console — ready for Twilio/SendGrid swap
- Status states: `PENDING` → `VERIFIED` / `EXPIRED` / `FAILED`

### AspectJ Audit Logging (Week 4)

`AuditAspect` uses `@Around` advice targeting all public methods in `com.vaultcore.controller.*`. Captures per request:
- Username (from JWT context)
- Method signature + sanitized parameters (passwords redacted)
- Result / response summary
- IP address + timestamp

Logging is `@Async` — zero added latency to API requests.

### iText 7 PDF Statements (Week 4)

- Library: iText 7.2.5 (`kernel` + `layout` + `io`)
- Includes: account summary, opening/closing balance in ₹ INR, all DEBIT/CREDIT entries
- PDF is password-protected using the account number
- Filename: `VaultCore_Statement_{acc}_{month}_{year}.pdf`

### Live Stock Portfolio & Latency Monitor (Week 3)

- Prices auto-refresh every **5 seconds** via `setInterval`
- `AreaChart` — last 20 price data points, ₹ INR Y-axis
- `LineChart` — per-request latency with red dashed **300ms SLA** threshold line
- `LatencyBadge` — 🟢 < 100ms · 🟡 100–300ms · 🔴 > 300ms
- Violation counter tracks how many requests exceeded the SLA

### Indian Rupee (₹ INR) Formatting

All monetary values use the `en-IN` locale:

```javascript
const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2
  }).format(amount);
```

| Raw Value | Formatted | Name |
|-----------|-----------|------|
| 1000 | ₹1,000.00 | One Thousand |
| 100000 | ₹1,00,000.00 | One Lakh |
| 10000000 | ₹1,00,00,000.00 | One Crore |

---

## 🔐 Security Notes

| Item | Status |
|------|--------|
| JWT Secret | ⚠️ Hardcoded — use `${JWT_SECRET}` env var in production |
| DB Password | ⚠️ Plaintext in `application.properties` — use secrets manager in production |
| Password Hashing | ✅ BCrypt cost factor 10 |
| CORS | ✅ Restricted to `http://localhost:3000` — update for production |
| JWT Expiry | 24 hours — adjust per security policy |
| Fraud OTP | ⚠️ Mock mode only — integrate Twilio/SendGrid before production |
| SSL/HTTPS | ⚠️ Not configured — add SSL certificate for production |

---

## 🛠 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend fails — DB connection refused | Ensure MySQL is running and `vaultcore_db` exists. Check credentials in `application.properties` |
| `UnsupportedClassVersionError` | Ensure `JAVA_HOME` points to JDK 21+. Run: `java -version` |
| CORS error in browser | Verify backend is on port 8081. Check `CorsConfig.java` allowed origins |
| 401 Unauthorized on all API calls | Token expired or missing — log out and log back in |
| PDF download blank / corrupted | Check `StatementService` logs. Verify account has ledger entries for selected month |
| No 2FA modal on transfer | Amount must exceed `fraud.threshold` (default ₹10,000). Check Network tab for `202` response |
| OTP expired | OTP valid for 5 minutes (`fraud.otp.expiry.minutes`). Start a new transfer |
| Stock prices not updating | Ensure `/api/stocks` is reachable. Check browser console for 401/CORS errors |
| Latency always > 300ms | Normal on cold-start. Subsequent requests faster with warm HikariCP pool |

---

## ⚡ Quick-Start Checklist

1. Install Java 21, Maven 3.8+, MySQL 8, Node 18+
2. Run `schema.sql` → creates all 5 tables + sample data
3. `cd vaultcore_backend && ./mvnw spring-boot:run` → starts on `:8081`
4. `cd frontend && npm install && npm start` → starts on `:3000`
5. Login: `john_doe` / `password` (or `jane_smith` / `password` or `admin` / `password`)
6. Test 2FA: transfer > ₹10,000 → check backend console for OTP
7. Test PDF: Statement page → select account & month → Download PDF
8. Test Audit: login as `admin` → Audit Log tab

---

## 📁 Project Structure

```
VaultCore/
├── schema.sql                  # MySQL schema + seed data
├── vaultcore_backend/          # Spring Boot backend
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   ├── logs/
│   └── src/main/
│       ├── java/com/vaultcore/
│       └── resources/
│           └── application.properties
└── frontend/                   # React frontend
    ├── package.json
    └── src/
        ├── App.js
        ├── config/api.js
        └── components/
```

---

*VaultCore Financial · Spring Boot 3.1.5 + React 18 + MySQL 8 · All amounts in ₹ INR*
