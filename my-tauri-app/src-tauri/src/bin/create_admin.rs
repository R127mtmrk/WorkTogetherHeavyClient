/// Outil CLI pour créer un compte dans la table `app_user`
/// Usage : cargo run --bin create-admin
///
/// Variables d'environnement requises (ou .env) :
///   DATABASE_URL=mysql://user:pass@127.0.0.1/ma_bdd

use anyhow::Result;
use dotenvy::dotenv;
use sqlx::mysql::MySqlPoolOptions;
use std::env;
use std::io::{self, Write};

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL non défini dans .env");

    println!("=== Création d'un compte app_user ===");
    println!("Base de données : {}", &database_url);
    println!();

    // Lire les infos depuis le terminal
    let email = prompt("Email        : ")?;
    let username = prompt("Username (optionnel, Entrée pour ignorer) : ")?;
    let password = prompt("Mot de passe (min 6 caractères) : ")?;

    if password.len() < 6 {
        eprintln!("❌ Le mot de passe doit contenir au moins 6 caractères.");
        std::process::exit(1);
    }

    println!();
    println!("Rôles disponibles :");
    println!("  1. ROLE_ADMIN");
    println!("  2. ROLE_COMPTABLE");
    println!("  3. ROLE_TECHNICIEN");
    println!("  4. ROLE_USER");
    let role_choice = prompt("Choisir un rôle (1-4, défaut=1 ROLE_ADMIN) : ")?;

    let role = match role_choice.trim() {
        "2" => "ROLE_COMPTABLE",
        "3" => "ROLE_TECHNICIEN",
        "4" => "ROLE_USER",
        _   => "ROLE_ADMIN",
    };

    let roles_json = format!("[\"{}\"]", role);

    // Hash du mot de passe en bcrypt $2b$
    print!("Hashage du mot de passe... ");
    io::stdout().flush()?;
    let hashed = bcrypt::hash(&password, bcrypt::DEFAULT_COST)?;
    println!("✅");

    // Connexion BDD
    let pool = MySqlPoolOptions::new()
        .max_connections(2)
        .connect(&database_url)
        .await?;

    // Créer la table si nécessaire
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    )
    .execute(&pool)
    .await?;

    let username_opt: Option<String> = if username.trim().is_empty() {
        None
    } else {
        Some(username.trim().to_string())
    };

    let result = sqlx::query(
        "INSERT INTO app_user (email, username, password, roles) VALUES (?, ?, ?, ?)",
    )
    .bind(email.trim())
    .bind(&username_opt)
    .bind(&hashed)
    .bind(&roles_json)
    .execute(&pool)
    .await;

    match result {
        Ok(r) => {
            println!();
            println!("✅ Compte créé avec succès !");
            println!("   ID      : {}", r.last_insert_id());
            println!("   Email   : {}", email.trim());
            println!("   Rôle    : {}", role);
            println!();
            println!("Tu peux maintenant te connecter dans l'application Tauri.");
        }
        Err(e) if e.to_string().contains("Duplicate") || e.to_string().contains("1062") => {
            eprintln!("❌ Un compte avec cet email existe déjà.");
            std::process::exit(1);
        }
        Err(e) => {
            eprintln!("❌ Erreur BDD : {e}");
            std::process::exit(1);
        }
    }

    Ok(())
}

fn prompt(label: &str) -> Result<String> {
    print!("{}", label);
    io::stdout().flush()?;
    let mut buf = String::new();
    io::stdin().read_line(&mut buf)?;
    Ok(buf.trim_end_matches(['\n', '\r']).to_string())
}

