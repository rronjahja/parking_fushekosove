-- ============================================================================
--  Parking System – Fushë Kosovë
--  Skript i plotë MySQL / MariaDB: krijon bazën, tabelat, indekset dhe
--  (opsionalisht) përdoruesit demo të stafit.
--
--  Si ta ekzekutosh:
--    • phpMyAdmin (XAMPP):  Import → zgjidh këtë skedar → Go
--    • MySQL Workbench:     File → Open SQL Script → Run (⚡)
--    • Linja komanduese:    mysql -u root -p < parking_system.sql
--
--  Shënim: aplikacioni i krijon vetë këto tabela në nisjen e parë. Ky skript
--  jepet për ata që duan ta përgatisin bazën manualisht ose ta shohin skemën.
-- ============================================================================

-- 1) Krijo bazën dhe zgjidhe si aktive -------------------------------------
CREATE DATABASE IF NOT EXISTS `parking_system`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `parking_system`;

-- Gjatë krijimit, çaktivizo përkohësisht kontrollin e çelësave të huaj.
SET FOREIGN_KEY_CHECKS = 0;

-- 2) Përdoruesit (staf: Agjent / Admin / Super Admin) ----------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            VARCHAR(64)  NOT NULL,
  `username`      VARCHAR(64)  NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name`     VARCHAR(160) NOT NULL,
  `role`          ENUM('AGENT','ADMIN','SUPERADMIN') NOT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Zonat (P1 ... P99) -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `zones` (
  `id`         VARCHAR(8)   NOT NULL,          -- p.sh. 'P1'
  `name`       VARCHAR(160) NOT NULL,
  `center_lat` DOUBLE       NOT NULL,
  `center_lng` DOUBLE       NOT NULL,
  `zoom`       INT          NOT NULL DEFAULT 19,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Vendet e parkimit ------------------------------------------------------
CREATE TABLE IF NOT EXISTS `spots` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `zone_id`    VARCHAR(8)   NOT NULL,
  `number`     INT          NOT NULL,
  `type`       ENUM('standard','accessible') NOT NULL DEFAULT 'standard',
  `status`     ENUM('free','reserved','occupied') NOT NULL DEFAULT 'free',
  `lat`        DOUBLE       NOT NULL,
  `lng`        DOUBLE       NOT NULL,
  `angle_deg`  DOUBLE       NOT NULL DEFAULT 0,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_zone_number` (`zone_id`, `number`),
  KEY `idx_spots_zone_status` (`zone_id`, `status`),
  CONSTRAINT `fk_spots_zone` FOREIGN KEY (`zone_id`)
    REFERENCES `zones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Kuletat e krediteve ----------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallets` (
  `owner_id`        VARCHAR(96) NOT NULL,       -- id perdoruesi ose 'guest:<uuid>'
  `balance_credits` INT         NOT NULL DEFAULT 0,
  `updated_at`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Historiku i lëvizjeve të krediteve -------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id`            VARCHAR(64)  NOT NULL,
  `owner_id`      VARCHAR(96)  NOT NULL,
  `delta_credits` INT          NOT NULL,        -- + rimbushje / - shpenzim
  `reason`        VARCHAR(255) NOT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wtx_owner` (`owner_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) Pagesat ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id`             VARCHAR(64)  NOT NULL,
  `method`         ENUM('sms','terminal','credits','card') NOT NULL,
  `amount_cents`   INT          NOT NULL,
  `amount_credits` INT          NOT NULL,
  `status`         ENUM('pending','paid','failed','refunded') NOT NULL,
  `reservation_id` VARCHAR(64)  DEFAULT NULL,
  `owner_id`       VARCHAR(96)  NOT NULL,
  `reference`      VARCHAR(160) DEFAULT NULL,   -- referenca nga gateway (placeholder)
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8) Rezervimet -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservations` (
  `id`             VARCHAR(64)  NOT NULL,
  `zone_id`        VARCHAR(8)   NOT NULL,
  `spot_id`        INT          NOT NULL,
  `spot_number`    INT          NOT NULL,
  `plate`          VARCHAR(32)  NOT NULL,
  `duration_key`   VARCHAR(16)  NOT NULL,
  `duration_label` VARCHAR(32)  NOT NULL,
  `minutes`        INT          NOT NULL,
  `amount_cents`   INT          NOT NULL,
  `amount_credits` INT          NOT NULL,
  `payment_method` VARCHAR(16)  NOT NULL,
  `payment_id`     VARCHAR(64)  DEFAULT NULL,
  `status`         ENUM('pending','active','expired','cancelled') NOT NULL,
  `owner_id`       VARCHAR(96)  NOT NULL,
  `start_time`     DATETIME     NOT NULL,
  `expires_at`     DATETIME     NOT NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_res_status_exp` (`status`, `expires_at`),
  KEY `idx_res_plate` (`plate`, `status`),
  KEY `idx_res_owner` (`owner_id`, `status`),
  KEY `idx_res_spot` (`spot_id`),
  KEY `idx_res_zone` (`zone_id`),
  CONSTRAINT `fk_res_zone` FOREIGN KEY (`zone_id`)
    REFERENCES `zones` (`id`),
  CONSTRAINT `fk_res_spot` FOREIGN KEY (`spot_id`)
    REFERENCES `spots` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9) Bisedat e mbështetjes --------------------------------------------------
CREATE TABLE IF NOT EXISTS `chats` (
  `id`                     VARCHAR(64)  NOT NULL,
  `owner_id`               VARCHAR(96)  NOT NULL,
  `subject`                VARCHAR(160) DEFAULT NULL,
  `status`                 ENUM('open','assigned','closed') NOT NULL DEFAULT 'open',
  `assigned_agent_id`      VARCHAR(64)  DEFAULT NULL,
  `related_reservation_id` VARCHAR(64)  DEFAULT NULL,
  `created_at`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at`              DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_chats_status` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10) Mesazhet e bisedave ---------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id`          VARCHAR(64) NOT NULL,
  `chat_id`     VARCHAR(64) NOT NULL,
  `sender_type` ENUM('user','agent','system') NOT NULL,
  `sender_id`   VARCHAR(64) DEFAULT NULL,
  `text`        TEXT        NOT NULL,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at`     DATETIME    DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_msgs_chat` (`chat_id`, `created_at`),
  CONSTRAINT `fk_msgs_chat` FOREIGN KEY (`chat_id`)
    REFERENCES `chats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11) Regjistri i auditimit -------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`         VARCHAR(64)  NOT NULL,
  `actor`      VARCHAR(96)  NOT NULL,
  `action`     VARCHAR(64)  NOT NULL,
  `entity`     VARCHAR(160) DEFAULT NULL,
  `details`    TEXT         DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12) Regjistri i backup-eve ------------------------------------------------
CREATE TABLE IF NOT EXISTS `backup_logs` (
  `id`               VARCHAR(64)  NOT NULL,
  `backup_type`      VARCHAR(16)  NOT NULL DEFAULT 'full',
  `status`           ENUM('pending','completed','failed','cancelled') NOT NULL,
  `started_at`       DATETIME     NOT NULL,
  `completed_at`     DATETIME     DEFAULT NULL,
  `storage_location` VARCHAR(255) DEFAULT NULL,
  `created_by`       VARCHAR(96)  NOT NULL,
  `checksum`         VARCHAR(80)  DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
--  OPSIONALE: Përdoruesit demo të stafit
--  Aplikacioni i krijon vetë këta gjatë seed-imit. Nëse doni t'i futni me
--  dorë, hiqni komentet më poshtë. Fjalëkalimet janë hash bcrypt për:
--     admin      → Admin123!
--     superadmin → Super123!
--     agjenti    → Agjent123!
--  NDRYSHONI fjalëkalimet në produksion!
-- ============================================================================
-- INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `role`) VALUES
--   ('u-admin',      'admin',      '$2a$10$3Qb1s3q0k7yQh5Yx2m1uO.7dJ8m9wKc1oQ2r3s4t5u6v7w8x9y0z', 'Administratori i Sistemit', 'ADMIN'),
--   ('u-superadmin', 'superadmin', '$2a$10$3Qb1s3q0k7yQh5Yx2m1uO.7dJ8m9wKc1oQ2r3s4t5u6v7w8x9y0z', 'Super Administratori',      'SUPERADMIN'),
--   ('u-agjenti',    'agjenti',    '$2a$10$3Qb1s3q0k7yQh5Yx2m1uO.7dJ8m9wKc1oQ2r3s4t5u6v7w8x9y0z', 'Agjenti i Mbështetjes',     'AGENT');
-- (Shënim: hash-et më sipër janë ilustrative. Mënyra e rekomanduar është të
--  lini aplikacionin t'i gjenerojë vetë me `npm run seed`, që prodhon hash-e
--  të vlefshme bcrypt automatikisht.)


ALTER TABLE `users`
  ADD COLUMN `email`          VARCHAR(160) DEFAULT NULL,
  ADD COLUMN `phone`          VARCHAR(32)  DEFAULT NULL,
  ADD COLUMN `email_verified` TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN `phone_verified` TINYINT NOT NULL DEFAULT 0;
ALTER TABLE `users` MODIFY COLUMN `username` VARCHAR(64) DEFAULT NULL;
ALTER TABLE `users` MODIFY COLUMN `role`
  ENUM('CUSTOMER','AGENT','ADMIN','SUPERADMIN') NOT NULL DEFAULT 'CUSTOMER';
ALTER TABLE `users` ADD UNIQUE KEY `uq_users_email` (`email`);
ALTER TABLE `users` ADD UNIQUE KEY `uq_users_phone` (`phone`);

CREATE TABLE IF NOT EXISTS `verification_codes` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `channel` ENUM('email','phone') NOT NULL,
  `code` VARCHAR(12) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `consumed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vcodes_user` (`user_id`, `channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE users ADD COLUMN saved_plate VARCHAR(32) DEFAULT NULL;