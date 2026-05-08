use serde::Serialize;
use sqlx::FromRow;

/// Utilisateur propre à l'application Tauri (table app_user)
#[derive(Debug, Serialize, FromRow)]
pub struct AppUser {
    pub id: i32,
    pub email: String,
    pub username: String,
    pub password: String,
    /// JSON string stocké en base, ex: ["ROLE_ADMIN","ROLE_USER"]
    pub roles: String,
    pub is_active: i8,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Ticket {
    pub id: i32,
    pub client_id: i32,
    pub title: String,
    pub description: String,
    pub priority: String,
    pub status: String,
    pub assigned_to: Option<i32>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Bay {
    pub id: i32,
    pub name_bay: String,
    pub units_total: i64,
    pub units_free: i64,
}

#[derive(Debug, Serialize)]
pub struct ComptableStats {
    pub total_baies: i32,
    pub total_offres: i32,
    pub total_commandes: i32,
    pub taux_occupation: f64,
}