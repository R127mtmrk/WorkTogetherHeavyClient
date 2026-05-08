-- Migration : table des utilisateurs propres à l'application Tauri
-- Compatible avec la BDD Symfony (même base), mais indépendante de la table client/user Symfony

CREATE TABLE IF NOT EXISTS `app_user` (
    `id`         INT            NOT NULL AUTO_INCREMENT,
    `email`      VARCHAR(180)   NOT NULL,
    `username`   VARCHAR(100)   NULL,
    `password`   VARCHAR(255)   NOT NULL  COMMENT 'Hash bcrypt $2b$',
    `roles`      JSON           NOT NULL  DEFAULT (JSON_ARRAY('ROLE_USER')),
    `is_active`  TINYINT(1)     NOT NULL  DEFAULT 1,
    `created_at` DATETIME       NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_app_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `app_user` (`email`, `username`, `password`, `roles`, `is_active`) VALUES
('admin@worktogether.com'