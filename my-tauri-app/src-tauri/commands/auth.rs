use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::State;
use crate::db::DbPool;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub password: String,
    pub roles: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResult {
    pub user_id: i64,
    pub email: String,
    pub roles: Vec<String>,
}

pub fn verify_password(plain: &str, hash: &str) -> bool {
    println!("=== verify_password ===");
    println!("plain    : {}", plain);
    println!("hash     : {}", hash);

    if hash.starts_with("$2y$") || hash.starts_with("$2a$") || hash.starts_with("$2b$") {
        let normalized = hash
            .replacen("$2y$", "$2b$", 1)
            .replacen("$2a$", "$2b$", 1);
        println!("normalized: {}", normalized);
        let result = bcrypt::verify(plain, &normalized).unwrap_or(false);
        println!("résultat bcrypt : {}", result);
        result
    } else if hash.starts_with("$argon2") {
        use argon2::{Argon2, PasswordHash, PasswordVerifier};
        let result = PasswordHash::new(hash)
            .map_or(false, |h| Argon2::default().verify_password(plain.as_bytes(), &h).is_ok());
        println!("argon2 résultat : {}", result);
        result
    } else {
        println!("⚠️ Format de hash non reconnu !");
        false
    }
}

#[tauri::command]
pub async fn login(
    identifier: String,
    password: String,
    pool: State<'_, DbPool>,
) -> Result<AuthResult, String> {
    println!("=== login ===");
    println!("identifier: '{}'", identifier);
    println!("password  : '{}'", password);

    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password, CAST(roles AS CHAR) as roles FROM `user` WHERE email = ? LIMIT 1"
    )
        .bind(&identifier)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| {
            println!("❌ Erreur SQL : {:?}", e);
            format!("Erreur BDD : {e}")
        })?;

    println!("user trouvé : {}", user.is_some());

    let user = user.ok_or_else(|| "Identifiants invalides.".to_string())?;

    println!("hash en BDD : {}", &user.password);
    println!("longueur hash : {}", user.password.len());

    if !verify_password(&password, &user.password) {
        return Err("Mot de passe incorrect.".to_string());
    }

    let roles: Vec<String> = serde_json::from_str(&user.roles)
        .unwrap_or_else(|_| vec!["ROLE_USER".to_string()]);

    println!("✅ Connexion réussie pour : {}", &user.email);

    Ok(AuthResult {
        user_id: user.id,
        email: user.email,
        roles,
    })
}

#[tauri::command]
pub async fn logout() -> Result<(), String> {
    Ok(())
}