// Skema e bazes se te dhenave (MySQL/MariaDB). Idempotente - ekzekutohet ne
// cdo nisje me "CREATE TABLE IF NOT EXISTS". Tabelat perdorin InnoDB per
// transaksione ACID dhe celesa te huaj.
import { db } from './connection.js';

export async function migrate() {
  await db.exec(`
CREATE TABLE IF NOT EXISTS users (
      id            VARCHAR(64) PRIMARY KEY,
      username      VARCHAR(64) UNIQUE,
      email         VARCHAR(160) UNIQUE,
      phone         VARCHAR(32) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name     VARCHAR(160) NOT NULL,
      role          ENUM('CUSTOMER','AGENT','ADMIN','SUPERADMIN') NOT NULL DEFAULT 'CUSTOMER',
      email_verified TINYINT NOT NULL DEFAULT 0,
      phone_verified TINYINT NOT NULL DEFAULT 0,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS verification_codes (
      id         VARCHAR(64) PRIMARY KEY,
      user_id    VARCHAR(64) NOT NULL,
      channel    ENUM('email','phone') NOT NULL,
      code       VARCHAR(12) NOT NULL,
      expires_at DATETIME NOT NULL,
      consumed_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_vcodes_user (user_id, channel)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS zones (
      id         VARCHAR(8) PRIMARY KEY,
      name       VARCHAR(160) NOT NULL,
      center_lat DOUBLE NOT NULL,
      center_lng DOUBLE NOT NULL,
      zoom       INT NOT NULL DEFAULT 19,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS spots (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      zone_id    VARCHAR(8) NOT NULL,
      number     INT NOT NULL,
      type       ENUM('standard','accessible') NOT NULL DEFAULT 'standard',
      status     ENUM('free','reserved','occupied') NOT NULL DEFAULT 'free',
      lat        DOUBLE NOT NULL,
      lng        DOUBLE NOT NULL,
      angle_deg  DOUBLE NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_zone_number (zone_id, number),
      KEY idx_spots_zone_status (zone_id, status),
      CONSTRAINT fk_spots_zone FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS wallets (
      owner_id        VARCHAR(96) PRIMARY KEY,
      balance_credits INT NOT NULL DEFAULT 0,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id            VARCHAR(64) PRIMARY KEY,
      owner_id      VARCHAR(96) NOT NULL,
      delta_credits INT NOT NULL,
      reason        VARCHAR(255) NOT NULL,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_wtx_owner (owner_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS payments (
      id             VARCHAR(64) PRIMARY KEY,
      method         ENUM('sms','terminal','credits','card') NOT NULL,
      amount_cents   INT NOT NULL,
      amount_credits INT NOT NULL,
      status         ENUM('pending','paid','failed','refunded') NOT NULL,
      reservation_id VARCHAR(64),
      owner_id       VARCHAR(96) NOT NULL,
      reference      VARCHAR(160),
      created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_payments_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS reservations (
      id             VARCHAR(64) PRIMARY KEY,
      zone_id        VARCHAR(8) NOT NULL,
      spot_id        INT NOT NULL,
      spot_number    INT NOT NULL,
      plate          VARCHAR(32) NOT NULL,
      duration_key   VARCHAR(16) NOT NULL,
      duration_label VARCHAR(32) NOT NULL,
      minutes        INT NOT NULL,
      amount_cents   INT NOT NULL,
      amount_credits INT NOT NULL,
      payment_method VARCHAR(16) NOT NULL,
      payment_id     VARCHAR(64),
      status         ENUM('pending','active','expired','cancelled') NOT NULL,
      owner_id       VARCHAR(96) NOT NULL,
      start_time     DATETIME NOT NULL,
      expires_at     DATETIME NOT NULL,
      created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_res_status_exp (status, expires_at),
      KEY idx_res_plate (plate, status),
      KEY idx_res_owner (owner_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS chats (
      id                     VARCHAR(64) PRIMARY KEY,
      owner_id               VARCHAR(96) NOT NULL,
      subject                VARCHAR(160),
      status                 ENUM('open','assigned','closed') NOT NULL DEFAULT 'open',
      assigned_agent_id      VARCHAR(64),
      related_reservation_id VARCHAR(64),
      created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closed_at              DATETIME,
      KEY idx_chats_status (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS chat_messages (
      id          VARCHAR(64) PRIMARY KEY,
      chat_id     VARCHAR(64) NOT NULL,
      sender_type ENUM('user','agent','system') NOT NULL,
      sender_id   VARCHAR(64),
      text        TEXT NOT NULL,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at     DATETIME,
      KEY idx_msgs_chat (chat_id, created_at),
      CONSTRAINT fk_msgs_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS audit_logs (
      id         VARCHAR(64) PRIMARY KEY,
      actor      VARCHAR(96) NOT NULL,
      action     VARCHAR(64) NOT NULL,
      entity     VARCHAR(160),
      details    TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_audit_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS backup_logs (
      id               VARCHAR(64) PRIMARY KEY,
      backup_type      VARCHAR(16) NOT NULL DEFAULT 'full',
      status           ENUM('pending','completed','failed','cancelled') NOT NULL,
      started_at       DATETIME NOT NULL,
      completed_at     DATETIME,
      storage_location VARCHAR(255),
      created_by       VARCHAR(96) NOT NULL,
      checksum         VARCHAR(80)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}
