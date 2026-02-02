-- Schema initial pour SimpleTicketDesk
-- Respect des conventions de nommage (pk_*, fk_*) definies dans PROJECT_RULES_183.md

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS t_ticket;
DROP TABLE IF EXISTS t_status;
DROP TABLE IF EXISTS t_user;

CREATE TABLE t_user (
    pk_user INT AUTO_INCREMENT PRIMARY KEY,
    lastname VARCHAR(100) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    mfa_secret_base32 VARCHAR(64) NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE t_status (
    pk_status INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(50) NOT NULL
);

CREATE TABLE t_ticket (
    pk_ticket INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    fk_status INT NOT NULL,
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    fk_user INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_status FOREIGN KEY (fk_status) REFERENCES t_status(pk_status),
    CONSTRAINT fk_ticket_user FOREIGN KEY (fk_user) REFERENCES t_user(pk_user)
);

CREATE TABLE audit_log (
    pk_audit_log INT AUTO_INCREMENT PRIMARY KEY,
    fk_user INT NULL,
    action VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (fk_user) REFERENCES t_user(pk_user) ON DELETE SET NULL
);

-- Statuts de reference
INSERT INTO t_status (label) VALUES ('OPEN'), ('IN_PROGRESS'), ('CLOSED');

-- Compte administrateur seed (mot de passe stocke uniquement en hash)
INSERT INTO t_user (lastname, firstname, email, password_hash, role)
VALUES ('Admin', 'Admin', 'admin@example.com', '$2b$10$k9Tvp4fMtXbAXaPLH1vAJuI.M3qr1YsmSj5LwBPR9t841FkeN0lgS', 'ADMIN');
