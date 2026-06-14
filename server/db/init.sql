-- jiaoyou database schema
-- MySQL 8.0+
-- Charset: utf8mb4

CREATE DATABASE IF NOT EXISTS `jiaoyou`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `jiaoyou`;

-- ============================================================
-- users
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `phone`         VARCHAR(20)  NOT NULL,
  `email`         VARCHAR(120) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_phone` (`phone`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- profiles (1:1 with users)
-- ============================================================
CREATE TABLE IF NOT EXISTS `profiles` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `nickname`    VARCHAR(60)  NOT NULL DEFAULT '',
  `avatar`      VARCHAR(500) DEFAULT NULL,
  `gender`      TINYINT      DEFAULT NULL COMMENT '0=unknown,1=male,2=female',
  `birthday`    DATE         DEFAULT NULL,
  `bio`         VARCHAR(500) DEFAULT NULL,
  `province`    VARCHAR(60)  DEFAULT NULL,
  `city`        VARCHAR(60)  DEFAULT NULL,
  `interests`   JSON         DEFAULT NULL,
  `last_active` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_profiles_user_id` (`user_id`),
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- swipes
-- ============================================================
CREATE TABLE IF NOT EXISTS `swipes` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `swiper_id`  BIGINT UNSIGNED NOT NULL,
  `swiped_id`  BIGINT UNSIGNED NOT NULL,
  `action`     TINYINT NOT NULL COMMENT '1=like, 2=pass',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_swipes_pair` (`swiper_id`, `swiped_id`),
  KEY `idx_swipes_swiped_action` (`swiped_id`, `action`),
  CONSTRAINT `fk_swipes_swiper` FOREIGN KEY (`swiper_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_swipes_swiped` FOREIGN KEY (`swiped_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- matches (canonical ordering: user_a_id < user_b_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS `matches` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_a_id`  BIGINT UNSIGNED NOT NULL,
  `user_b_id`  BIGINT UNSIGNED NOT NULL,
  `matched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_matches_pair` (`user_a_id`, `user_b_id`),
  KEY `idx_matches_user_a` (`user_a_id`),
  KEY `idx_matches_user_b` (`user_b_id`),
  CONSTRAINT `fk_matches_user_a` FOREIGN KEY (`user_a_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_matches_user_b` FOREIGN KEY (`user_b_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- messages
-- ============================================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `match_id`     BIGINT UNSIGNED NOT NULL,
  `sender_id`    BIGINT UNSIGNED NOT NULL,
  `content`      TEXT         NOT NULL,
  `content_type` TINYINT      NOT NULL DEFAULT 1 COMMENT '1=text,2=image,3=system',
  `read_at`      DATETIME     DEFAULT NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_match_created` (`match_id`, `created_at`),
  CONSTRAINT `fk_messages_match` FOREIGN KEY (`match_id`)
    REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- reports
-- ============================================================
CREATE TABLE IF NOT EXISTS `reports` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reporter_id` BIGINT UNSIGNED NOT NULL,
  `reported_id` BIGINT UNSIGNED NOT NULL,
  `reason`      VARCHAR(500) NOT NULL,
  `status`      TINYINT NOT NULL DEFAULT 0 COMMENT '0=pending,1=resolved,2=dismissed',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reports_reported` (`reported_id`),
  CONSTRAINT `fk_reports_reporter` FOREIGN KEY (`reporter_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reports_reported` FOREIGN KEY (`reported_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- blocks
-- ============================================================
CREATE TABLE IF NOT EXISTS `blocks` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `blocker_id` BIGINT UNSIGNED NOT NULL,
  `blocked_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_blocks_pair` (`blocker_id`, `blocked_id`),
  KEY `idx_blocks_blocked` (`blocked_id`),
  CONSTRAINT `fk_blocks_blocker` FOREIGN KEY (`blocker_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_blocks_blocked` FOREIGN KEY (`blocked_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;