use sqlx::MySqlPool;
use crate::models::{AppUser, Ticket, Bay, ComptableStats};

pub struct Repo {
    pub pool: MySqlPool,
}

impl Repo {
    pub fn new(pool: MySqlPool) -> Self {
        Self {
            pool
        }
    }

    // ─── Utilisateurs propres à l'app Tauri (table app_user) ──────────────────

    // Compte combien d'utilisateurs applicatifs existent déjà
    pub async fn count_app_users(&self) -> Result<i64, sqlx::Error> {
        let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM app_user")
            .fetch_one(&self.pool)
            .await?;
        Ok(count)
    }

    pub async fn get_app_user(&self, email: &str) -> Result<AppUser, sqlx::Error> {
        sqlx::query_as(
            "SELECT id, email, COALESCE(username, '') AS username, password, CAST(roles AS CHAR) AS roles, is_active \
             FROM app_user WHERE email = ? LIMIT 1"
        )
        .bind(email)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn create_app_user(
        &self,
        email: &str,
        username: Option<&str>,
        hashed_password: &str,
        roles: &str, // JSON string, e.g. [\"ROLE_ADMIN\"]
    ) -> Result<i64, sqlx::Error> {
        let result = sqlx::query(
            "INSERT INTO app_user (email, username, password, roles) VALUES (?, ?, ?, ?)"
        )
        .bind(email)
        .bind(username)
        .bind(hashed_password)
        .bind(roles)
        .execute(&self.pool)
        .await?;
        Ok(result.last_insert_id() as i64)
    }

    pub async fn run_migration(&self) -> Result<(), sqlx::Error> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS `app_user` (
                `id`         INT            NOT NULL AUTO_INCREMENT,
                `email`      VARCHAR(180)   NOT NULL,
                `username`   VARCHAR(100)   NULL,
                `password`   VARCHAR(255)   NOT NULL,
                `roles`      JSON           NOT NULL  DEFAULT (JSON_ARRAY('ROLE_USER')),
                `is_active`  TINYINT(1)     NOT NULL  DEFAULT 1,
                `created_at` DATETIME       NOT NULL  DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uniq_app_user_email` (`email`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        )
        .execute(&self.pool)
        .await?;

        // Colonnes de capacité sur la table bay (absentes du schéma Symfony)
        let _ = sqlx::query("ALTER TABLE bay ADD COLUMN units_total INT NOT NULL DEFAULT 0")
            .execute(&self.pool).await;
        let _ = sqlx::query("ALTER TABLE bay ADD COLUMN units_free INT NOT NULL DEFAULT 0")
            .execute(&self.pool).await;

        Ok(())
    }

    // Gestion tickets
    pub async fn get_tickets_open(&self) -> Result<Vec<Ticket>, sqlx::Error> {
        sqlx::query_as("SELECT * FROM ticket WHERE status='open' ORDER BY id DESC")
            .fetch_all(&self.pool).await
    }

    pub async fn close_ticket(&self, id: i32) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE ticket SET status = 'closed' WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // Seed initial des baies du datacenter (B001 → B030, 42U chacune)
    // Conforme au cahier des charges : "30 baies numérotées de B001 à B030".
    // Idempotent : ne fait rien si au moins une baie existe déjà.
    pub async fn seed_initial_bays(&self) -> Result<u32, sqlx::Error> {
        let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM bay")
            .fetch_one(&self.pool)
            .await?;
        if count > 0 {
            return Ok(0);
        }

        let mut inserted: u32 = 0;
        for n in 1..=30 {
            let name = format!("B{:03}", n);
            sqlx::query("INSERT INTO bay (name_bay, units_total, units_free) VALUES (?, 42, 42)")
                .bind(&name)
                .execute(&self.pool)
                .await?;
            inserted += 1;
        }
        Ok(inserted)
    }

    // Gestion baies
    pub async fn create_bay(&self, name: &str, units_total: i32) -> Result<i32, sqlx::Error> {
        let result = sqlx::query(
            "INSERT INTO bay (name_bay, units_total, units_free) VALUES (?, ?, ?)"
        ).bind(name).bind(units_total).bind(units_total)
            .execute(&self.pool).await?;
        Ok(result.last_insert_id() as i32)
    }

    pub async fn delete_bay(&self, id: i32) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM bay WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete_app_user(&self, id: i32) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM app_user WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get_bays(&self) -> Result<Vec<Bay>, sqlx::Error> {
        sqlx::query_as(
            "SELECT b.id, b.name_bay,
                CAST(GREATEST(b.units_total, COUNT(u.id)) AS SIGNED) AS units_total,
                CAST(GREATEST(b.units_free, CAST(COALESCE(SUM(u.is_free), 0) AS SIGNED)) AS SIGNED) AS units_free
             FROM bay b
             LEFT JOIN unit u ON u.bay_id = b.id
             GROUP BY b.id, b.name_bay, b.units_total, b.units_free
             ORDER BY b.name_bay"
        ).fetch_all(&self.pool).await
    }

    // Stats comptable
    pub async fn get_comptable_stats(&self) -> Result<ComptableStats, sqlx::Error> {
        let total_baies: (i32,) = sqlx::query_as("SELECT COUNT(*) FROM bay").fetch_one(&self.pool).await?;
        let total_offres: (i32,) = sqlx::query_as("SELECT COUNT(*) FROM offer").fetch_one(&self.pool).await?;
        let total_commandes: (i32,) = sqlx::query_as("SELECT COUNT(*) FROM `order`").fetch_one(&self.pool).await?;
        let taux_occupation: (String,) = sqlx::query_as(
            "SELECT CAST(IFNULL(AVG(taux), 0) AS CHAR) FROM (
                SELECT
                    (GREATEST(b.units_total, COUNT(u.id)) - GREATEST(b.units_free, COALESCE(SUM(u.is_free), 0)))
                    / NULLIF(GREATEST(b.units_total, COUNT(u.id)), 0) * 100 AS taux
                FROM bay b
                LEFT JOIN unit u ON u.bay_id = b.id
                GROUP BY b.id, b.units_total, b.units_free
             ) AS sub"
        ).fetch_one(&self.pool).await?;
        let taux_occupation = taux_occupation.0.parse::<f64>().unwrap_or(0.0);

        Ok(ComptableStats {
            total_baies: total_baies.0,
            total_offres: total_offres.0,
            total_commandes: total_commandes.0,
            taux_occupation,
        })
    }
}