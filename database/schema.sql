
-- ----------------------------------------------------------------
-- 1. USERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         BIGINT       PRIMARY KEY AUTO_INCREMENT,
    username   VARCHAR(50)  UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    phone      VARCHAR(20),
    role       VARCHAR(20)  DEFAULT 'USER',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- 2. ACCOUNTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
    id             BIGINT         PRIMARY KEY AUTO_INCREMENT,
    account_number VARCHAR(30)    UNIQUE NOT NULL,
    user_id        BIGINT         NOT NULL,
    account_type   VARCHAR(20)    DEFAULT 'SAVINGS',
    balance        DECIMAL(19,4)  DEFAULT 0.0000,   
    created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_balance_non_negative
        CHECK (balance >= 0)                        
);

-- ----------------------------------------------------------------
-- 3. LEDGER  (Double-Entry, Immutable)
-- ----------------------------------------------------------------
CREATE TABLE ledger (
    id                   BIGINT        PRIMARY KEY AUTO_INCREMENT,
    transaction_id       VARCHAR(40)   NOT NULL,
    account_ref          VARCHAR(30)   NOT NULL,
    counterpart_account  VARCHAR(30),
    entry_type           ENUM('DEBIT','CREDIT') NOT NULL,
    amount               DECIMAL(19,4) NOT NULL,
    balance_after        DECIMAL(19,4),
    type                 VARCHAR(20),
    description          TEXT,
    created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_ledger_txn_entry UNIQUE (transaction_id, entry_type),

    CONSTRAINT chk_ledger_amount_positive CHECK (amount > 0),

    INDEX idx_ledger_txn_id      (transaction_id),
    INDEX idx_ledger_account_ref (account_ref),
    INDEX idx_ledger_created_at  (created_at)
);

-- Trigger: Prevent UPDATE on ledger (immutability enforcement at DB level)
CREATE TRIGGER prevent_ledger_update
BEFORE UPDATE ON ledger
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ledger rows are immutable and cannot be modified';
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS prevent_ledger_delete;
DELIMITER $$
CREATE TRIGGER prevent_ledger_delete
BEFORE DELETE ON ledger
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ledger rows are immutable and cannot be deleted';
END$$
DELIMITER ;

-- Trigger: Prevent DELETE on ledger (immutability enforcement at DB level)
DROP TRIGGER IF EXISTS prevent_ledger_delete;
DELIMITER $$
CREATE TRIGGER prevent_ledger_delete
BEFORE DELETE ON ledger
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ledger rows are immutable and cannot be deleted';
END$$
DELIMITER ;

-- ----------------------------------------------------------------
-- 4. TWO FACTOR CHALLENGES  (Fraud Detection 2FA)
--    Stores pending OTP challenges for high-value transfers.
--    Created by FraudDetectionService when amount > fraud.threshold.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS two_factor_challenges (
    id           BIGINT        PRIMARY KEY AUTO_INCREMENT,
    challenge_id VARCHAR(50)   UNIQUE NOT NULL,           -- 2FA-{12 char UUID}
    username     VARCHAR(50)   NOT NULL,
    otp_code     VARCHAR(6)    NOT NULL,                  -- 6-digit OTP
    from_account VARCHAR(30),
    to_account   VARCHAR(30),
    amount       DECIMAL(19,4),
    description  TEXT,
    status       ENUM('PENDING','VERIFIED','EXPIRED','FAILED') NOT NULL DEFAULT 'PENDING',
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    expires_at   TIMESTAMP     NOT NULL,
    verified_at  TIMESTAMP     NULL,
    INDEX idx_2fa_challenge_id (challenge_id),
    INDEX idx_2fa_username     (username),
    INDEX idx_2fa_status       (status)
);

-- ----------------------------------------------------------------
-- 5. AUDIT LOG  (AspectJ AuditAspect — Week 4)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id         BIGINT        PRIMARY KEY AUTO_INCREMENT,
    username   VARCHAR(50),
    action     VARCHAR(200),
    method     VARCHAR(200),
    parameters TEXT,
    result     TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_username   (username),
    INDEX idx_audit_created_at (created_at)
);

-- ================================================================
-- SAMPLE DATA
-- Password for all sample users: "password"
-- BCrypt hash of "password":
-- $2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG
-- ================================================================

INSERT INTO users (username, password, email, phone, role) VALUES
('john_doe',   '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'john@example.com',  '1234567890', 'USER'),
('jane_smith', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'jane@example.com',  '0987654321', 'USER'),
('admin',      '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'admin@vaultcore.com','1111111111','ADMIN')
ON DUPLICATE KEY UPDATE username = username;  -- safe re-run: skip if already exists

INSERT INTO accounts (account_number, user_id, account_type, balance) VALUES
('ACC001', 1, 'SAVINGS',  5000.0000),
('ACC002', 1, 'CHECKING', 2500.0000),
('ACC003', 2, 'SAVINGS',  10000.0000),
('ACC004', 2, 'CHECKING', 3000.0000)
ON DUPLICATE KEY UPDATE account_number = account_number;  -- safe re-run
