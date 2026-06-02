// src/config.rs
use anyhow::Result;
use sqlx::{MySqlPool, mysql::MySqlPoolOptions};
use std::env;
use std::path::PathBuf;

/// URL par défaut embarquée dans le binaire.
/// Elle peut être surchargée par :
///  1. La variable d'environnement DATABASE_URL
///  2. Le fichier %APPDATA%\WorkTogether\config.env  (clé DATABASE_URL=...)
const DEFAULT_DATABASE_URL: &str =
    "mysql://wt_user:Wt%401234@10.192.72.20:3306/worktogether";

fn read_config_file() -> Option<String> {
    // Cherche %APPDATA%\WorkTogether\config.env
    let base = env::var("APPDATA").ok()?;
    let mut path = PathBuf::from(base);
    path.push("WorkTogether");
    path.push(".env");
    let content = std::fs::read_to_string(&path).ok()?;
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with("DATABASE_URL=") {
            return Some(line["DATABASE_URL=".len()..].to_string());
        }
    }
    None
}

pub fn get_database_url() -> String {
    // Priorité : variable d'env > fichier config > valeur par défaut
    if let Ok(url) = env::var("DATABASE_URL") {
        return url;
    }
    if let Some(url) = read_config_file() {
        return url;
    }
    DEFAULT_DATABASE_URL.to_string()
}

/// Tentative de connexion avec un timeout court (3 s). Ne panique pas.
pub async fn try_connect() -> Result<MySqlPool> {
    let _ = dotenvy::dotenv();
    let database_url = get_database_url();
    let pool = MySqlPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect(&database_url)
        .await?;
    Ok(pool)
}