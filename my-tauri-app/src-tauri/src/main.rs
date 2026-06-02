mod config;
mod models;
mod repository;

use axum::{
  extract::{Path, State as AxumState},
  routing::{get, post, put},
  Json, Router,
};

use bcrypt::verify;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::{
  atomic::{AtomicI32, Ordering},
  Arc,
};
use tauri::{Manager, State as TauriState};
use tokio::{sync::Mutex, task};
use tower_http::cors::CorsLayer;

use repository::Repo;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Offer {
  id: i32,
  label: String,
  units: i32,
  monthly: i32,
  #[serde(rename = "monthlyDiscount")]
  monthly_discount: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClientDto {
  id: i32,
  name: String,
  email: String,
  company: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ReservationDto {
  id: i32,
  client_id: i32,
  client_name: String,
  offer_id: i32,
  offer_name: String,
  amount: i32,
  start_date: String,
  end_date: String,
  status: String,
}

#[derive(Debug, Deserialize)]
struct OfferPayload {
  label: String,
  units: i32,
  monthly: i32,
  #[serde(rename = "monthlyDiscount")]
  monthly_discount: i32,
}

fn verify_bcrypt_password(password: &str, hash: &str) -> bool {
  if verify(password, hash).unwrap_or(false) {
    return true;
  }
  // Compatibilité avec les hashs $2y$ de PHP (Symfony)
  if hash.starts_with("$2y$") {
    let normalized = hash.replacen("$2y$", "$2b$", 1);
    return verify(password, &normalized).unwrap_or(false);
  }
  false
}

// Crée automatiquement un compte admin au premier lancement si aucun app_user n'existe.
async fn ensure_initial_admin(repo: Arc<Repo>) {
  // Si la table n'existe pas encore, run_migration l'a déjà créée avant cet appel.
  match repo.count_app_users().await {
    Ok(count) if count > 0 => {
      // Il existe déjà au moins un utilisateur applicatif, ne rien faire.
      return;
    }
    Ok(_) => {
      // Aucun utilisateur : on crée un compte admin par défaut.
      let email = "admin@local.test";
      let username = Some("admin");
      let roles = vec!["ROLE_ADMIN".to_string(), "ROLE_USER".to_string()];
      let roles_json = match serde_json::to_string(&roles) {
        Ok(r) => r,
        Err(e) => {
          eprintln!("[INIT ADMIN] Erreur de sérialisation des rôles: {e}");
          return;
        }
      };

      // Mot de passe par défaut : à changer après la première connexion.
      let default_password = "admin123!";
      let hashed = match bcrypt::hash(default_password, bcrypt::DEFAULT_COST) {
        Ok(h) => h,
        Err(e) => {
          eprintln!("[INIT ADMIN] Erreur de hashage du mot de passe initial: {e}");
          return;
        }
      };

      match repo
        .create_app_user(email, username, &hashed, &roles_json)
        .await
      {
        Ok(id) => {
          eprintln!(
            "[INIT ADMIN] Compte administrateur initial créé (id = {}, email = {}, mot de passe = {}). Pensez à changer ce mot de passe.",
            id, email, default_password
          );
        }
        Err(e) => {
          eprintln!("[INIT ADMIN] Erreur lors de la création du compte admin initial: {e}");
        }
      }
    }
    Err(e) => {
      eprintln!("[INIT ADMIN] Impossible de compter les utilisateurs app_user: {e}");
    }
  }
}

#[derive(Debug, Serialize)]
struct AuthUserDto {
  id: i32,
  email: String,
  username: String,
  roles: Vec<String>,
}

#[derive(Clone)]
struct AppState {
  repo: Arc<Repo>,
  offers: Arc<Mutex<Vec<Offer>>>,
  clients: Arc<Mutex<Vec<ClientDto>>>,
  reservations: Arc<Mutex<Vec<ReservationDto>>>,
  next_offer_id: Arc<AtomicI32>,
}

impl AppState {
  fn new(repo: Arc<Repo>) -> Self {
    let offers = vec![
      Offer { id: 1, label: "Base".to_string(), units: 1, monthly: 100, monthly_discount: 0 },
      Offer { id: 2, label: "Start-up".to_string(), units: 10, monthly: 900, monthly_discount: 10 },
      Offer { id: 3, label: "PME".to_string(), units: 21, monthly: 1680, monthly_discount: 20 },
      Offer { id: 4, label: "Entreprise".to_string(), units: 42, monthly: 2940, monthly_discount: 30 },
    ];

    let clients = vec![
      ClientDto { id: 1, name: "Acme Corp".to_string(), email: "it@acme.test".to_string(), company: "Acme Corp".to_string() },
      ClientDto { id: 2, name: "Globex".to_string(), email: "ops@globex.test".to_string(), company: "Globex".to_string() },
    ];

    let reservations = vec![
      ReservationDto {
        id: 1,
        client_id: 1,
        client_name: "Acme Corp".to_string(),
        offer_id: 2,
        offer_name: "Start-up".to_string(),
        amount: 900,
        start_date: "2026-01-01T00:00:00Z".to_string(),
        end_date: "2026-01-31T23:59:59Z".to_string(),
        status: "active".to_string(),
      },
      ReservationDto {
        id: 2,
        client_id: 2,
        client_name: "Globex".to_string(),
        offer_id: 1,
        offer_name: "Base".to_string(),
        amount: 100,
        start_date: "2026-02-01T00:00:00Z".to_string(),
        end_date: "2026-02-28T23:59:59Z".to_string(),
        status: "active".to_string(),
      },
    ];

    Self {
      repo,
      offers: Arc::new(Mutex::new(offers)),
      clients: Arc::new(Mutex::new(clients)),
      reservations: Arc::new(Mutex::new(reservations)),
      next_offer_id: Arc::new(AtomicI32::new(5)),
    }
  }
}

fn cleanup_old_logs(log_dir: &std::path::Path) {
  let cutoff = std::time::SystemTime::now()
    .checked_sub(std::time::Duration::from_secs(30 * 24 * 3600))
    .unwrap_or(std::time::UNIX_EPOCH);

  let Ok(entries) = std::fs::read_dir(log_dir) else { return };

  for entry in entries.flatten() {
    let path = entry.path();
    let is_log = path.extension().and_then(|e| e.to_str()) == Some("log");
    if !is_log { continue; }

    let Ok(meta) = std::fs::metadata(&path) else { continue };
    let Ok(modified) = meta.modified() else { continue };

    if modified < cutoff {
      let _ = std::fs::remove_file(&path);
    }
  }
}

fn show_dialog(level: rfd::MessageLevel, title: &str, description: &str) {
  rfd::MessageDialog::new()
    .set_level(level)
    .set_title(title)
    .set_description(description)
    .set_buttons(rfd::MessageButtons::Ok)
    .show();
}

async fn init_db_pool() -> sqlx::MySqlPool {
  // Première tentative
  if let Ok(pool) = config::try_connect().await {
    return pool;
  }

  // Échec — informer l'utilisateur et tenter de démarrer le service
  tokio::task::spawn_blocking(|| {
    show_dialog(
      rfd::MessageLevel::Warning,
      "WorkTogether — Démarrage de MySQL",
      "MySQL n'est pas accessible.\n\nTentative de démarrage du service wampmysqld64…",
    );
  }).await.ok();

  let _ = std::process::Command::new("net")
    .args(["start", "wampmysqld64"])
    .output();

  // Retry pendant 30 secondes
  for _ in 0..15 {
    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
    if let Ok(pool) = config::try_connect().await {
      return pool;
    }
  }

  // Toujours inaccessible — afficher l'erreur et quitter
  tokio::task::spawn_blocking(|| {
    show_dialog(
      rfd::MessageLevel::Error,
      "WorkTogether — Erreur de connexion",
      "Impossible de démarrer MySQL après 30 secondes.\n\n\
       Causes possibles :\n\
       • Droits insuffisants — essayez « Exécuter en tant qu'administrateur »\n\
       • WAMP n'est pas installé\n\
       • La base de données « worktogether » n'existe pas\n\n\
       L'application va se fermer.",
    );
  }).await.ok();

  std::process::exit(1);
}

#[tokio::main]
async fn main() {
  let pool = init_db_pool().await;
  let repo = Arc::new(Repo::new(pool));

  // Créer la table app_user si elle n'existe pas encore
  if let Err(e) = repo.run_migration().await {
    tokio::task::spawn_blocking(move || {
      show_dialog(
        rfd::MessageLevel::Error,
        "WorkTogether — Erreur de migration",
        &format!("La migration de la base de données a échoué :\n{e}\n\nL'application va se fermer."),
      );
    }).await.ok();
    std::process::exit(1);
  }

  // S'assurer qu'un compte admin existe au premier lancement
  ensure_initial_admin(repo.clone()).await;

  // Seed initial des 30 baies B001 → B030 (42U) si la table est vide
  match repo.seed_initial_bays().await {
    Ok(0) => {}
    Ok(n) => eprintln!("[SEED] {n} baies initiales insérées (B001 → B030, 42U)"),
    Err(e) => eprintln!("[SEED] Seed des baies ignoré : {e}"),
  }

  let state = AppState::new(repo.clone());

  let app = Router::new()
      .route("/api/tickets/open", get(get_tickets_open))
      .route("/api/bays", get(get_bays))
      .route("/api/bay", post(create_bay))
      .route("/api/stats", get(get_stats))
      .route("/api/offers", get(get_offers).post(create_offer_handler))
      .route("/api/offers/{id}", put(update_offer_handler).delete(delete_offer_handler))
      .route("/api/clients", get(get_clients))
      .route("/api/reservations", get(get_reservations))
      .layer(CorsLayer::permissive())
      .with_state(state.clone());

  match tokio::net::TcpListener::bind("127.0.0.1:3000").await {
    Ok(listener) => {
      task::spawn(async move {
        if let Err(err) = axum::serve(listener, app).await {
          eprintln!("Axum server error: {err}");
        }
      });
    }
    Err(err) => eprintln!("Axum not started: {err}"),
  }

  // En dev, attendre que Vite (port 5173) soit prêt avant d'ouvrir la fenêtre
  #[cfg(debug_assertions)]
  {
    use std::time::Duration;
    for _ in 0..20u32 {
      let ok = tokio::time::timeout(
        Duration::from_millis(300),
        tokio::net::TcpStream::connect("127.0.0.1:5173"),
      ).await.is_ok();
      if ok { break; }
      tokio::time::sleep(Duration::from_millis(500)).await;
    }
  }

  tauri::Builder::default()
      .plugin(
        tauri_plugin_log::Builder::new()
          .target(tauri_plugin_log::Target::new(
            tauri_plugin_log::TargetKind::LogDir {
              file_name: Some("worktogether".to_string()),
            },
          ))
          .max_file_size(5_000_000)
          .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
          .build(),
      )
      .plugin(tauri_plugin_dialog::init())
      .setup(|app| {
        if let Ok(log_dir) = app.path().app_log_dir() {
          cleanup_old_logs(&log_dir);
          log::info!("Nettoyage des logs > 30 jours effectué dans {:?}", log_dir);
        }
        log::info!("WorkTogether démarré");
        Ok(())
      })
      .manage(repo)
      .invoke_handler(tauri::generate_handler![get_tickets, close_ticket, get_baies, add_baie, delete_baie, login_db, create_app_user, list_app_users, delete_app_user, list_log_files, read_log_file, delete_log_file])
      .run(tauri::generate_context!())
      .expect("error while running tauri app");
}

#[tauri::command]
async fn get_tickets(repo: TauriState<'_, Arc<Repo>>) -> Result<Vec<models::Ticket>, String> {
  repo.get_tickets_open().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn close_ticket(id: i32, repo: TauriState<'_, Arc<Repo>>) -> Result<(), String> {
  repo.close_ticket(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_baies(repo: TauriState<'_, Arc<Repo>>) -> Result<Vec<models::Bay>, String> {
  repo.get_bays().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_baie(name: String, units_total: Option<i32>, repo: TauriState<'_, Arc<Repo>>) -> Result<i32, String> {
  let units_total = units_total.unwrap_or(1).max(1);
  repo.create_bay(&name, units_total).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_baie(id: i32, repo: TauriState<'_, Arc<Repo>>) -> Result<(), String> {
  repo.delete_bay(id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn login_db(identifier: String, password: String, repo: TauriState<'_, Arc<Repo>>) -> Result<AuthUserDto, String> {
  let user = repo
    .get_app_user(&identifier)
    .await
    .map_err(|_| "Identifiant ou mot de passe invalide.".to_string())?;

  if user.is_active == 0 {
    return Err("Ce compte est désactivé.".to_string());
  }

  if !verify_bcrypt_password(&password, &user.password) {
    return Err("Identifiant ou mot de passe invalide.".to_string());
  }

  let roles: Vec<String> = serde_json::from_str(&user.roles)
    .unwrap_or_else(|_| vec!["ROLE_USER".to_string()]);

  Ok(AuthUserDto {
    id: user.id,
    email: user.email.clone(),
    username: if user.username.is_empty() { user.email } else { user.username },
    roles,
  })
}

#[derive(Debug, Serialize)]
struct AppUserListItem {
  id: i32,
  email: String,
  username: String,
  roles: Vec<String>,
  is_active: bool,
}

#[tauri::command]
async fn list_app_users(repo: TauriState<'_, Arc<Repo>>) -> Result<Vec<AppUserListItem>, String> {
  let rows = sqlx::query_as::<_, crate::models::AppUser>(
    "SELECT id, email, COALESCE(username, '') AS username, password, CAST(roles AS CHAR) AS roles, is_active FROM app_user ORDER BY id"
  )
  .fetch_all(&repo.pool)
  .await
  .map_err(|e| format!("Erreur BDD : {e}"))?;

  let items = rows.into_iter().map(|u| {
    let roles: Vec<String> = serde_json::from_str(&u.roles).unwrap_or_else(|_| vec!["ROLE_USER".to_string()]);
    AppUserListItem {
      id: u.id,
      email: u.email,
      username: u.username,
      roles,
      is_active: u.is_active != 0,
    }
  }).collect();

  Ok(items)
}

#[derive(Debug, Deserialize)]
struct CreateAppUserPayload {
  email: String,
  username: Option<String>,
  password: String,
  roles: Option<Vec<String>>,
}

#[tauri::command]
async fn delete_app_user(id: i32, repo: TauriState<'_, Arc<Repo>>) -> Result<(), String> {
  repo.delete_app_user(id).await.map_err(|e| format!("Erreur suppression : {e}"))
}

#[tauri::command]
async fn create_app_user(payload: CreateAppUserPayload, repo: TauriState<'_, Arc<Repo>>) -> Result<i64, String> {
  if payload.email.trim().is_empty() {
    return Err("L'email est obligatoire.".to_string());
  }
  if payload.password.len() < 6 {
    return Err("Le mot de passe doit contenir au moins 6 caractères.".to_string());
  }

  let hashed = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST)
    .map_err(|e| format!("Erreur de hashage : {e}"))?;

  let roles = payload.roles.unwrap_or_else(|| vec!["ROLE_USER".to_string()]);
  let roles_json = serde_json::to_string(&roles).map_err(|e| format!("Erreur JSON : {e}"))?;

  let id = repo
    .create_app_user(
      payload.email.trim(),
      payload.username.as_deref(),
      &hashed,
      &roles_json,
    )
    .await
    .map_err(|e| format!("Erreur création utilisateur : {e}"))?;

  Ok(id)
}

async fn get_tickets_open(AxumState(state): AxumState<AppState>) -> Json<serde_json::Value> {
  match state.repo.get_tickets_open().await {
    Ok(tickets) => Json(json!(tickets)),
    Err(e) => Json(json!({"error": e.to_string()})),
  }
}

async fn get_bays(AxumState(state): AxumState<AppState>) -> Json<serde_json::Value> {
  match state.repo.get_bays().await {
    Ok(bays) => Json(json!(bays)),
    Err(e) => Json(json!({"error": e.to_string()})),
  }
}

#[derive(Deserialize)]
struct CreateBay {
  name: String,
  units_total: i32,
}

async fn create_bay(AxumState(state): AxumState<AppState>, Json(payload): Json<CreateBay>) -> Json<serde_json::Value> {
  match state.repo.create_bay(&payload.name, payload.units_total).await {
    Ok(id) => Json(json!({"id": id})),
    Err(e) => Json(json!({"error": e.to_string()})),
  }
}

async fn get_stats(AxumState(state): AxumState<AppState>) -> Json<serde_json::Value> {
  match state.repo.get_comptable_stats().await {
    Ok(stats) => Json(json!(stats)),
    Err(e) => Json(json!({"error": e.to_string()})),
  }
}

async fn get_offers(AxumState(state): AxumState<AppState>) -> Json<serde_json::Value> {
  let offers = state.offers.lock().await;
  Json(json!(offers.clone()))
}

async fn create_offer_handler(AxumState(state): AxumState<AppState>, Json(payload): Json<OfferPayload>) -> Json<serde_json::Value> {
  let id = state.next_offer_id.fetch_add(1, Ordering::SeqCst);
  let offer = Offer {
    id,
    label: payload.label,
    units: payload.units,
    monthly: payload.monthly,
    monthly_discount: payload.monthly_discount,
  };
  let mut offers = state.offers.lock().await;
  offers.push(offer.clone());
  Json(json!(offer))
}

async fn update_offer_handler(
  AxumState(state): AxumState<AppState>,
  Path(id): Path<i32>,
  Json(payload): Json<OfferPayload>,
) -> Json<serde_json::Value> {
  let mut offers = state.offers.lock().await;
  if let Some(offer) = offers.iter_mut().find(|o| o.id == id) {
    offer.label = payload.label;
    offer.units = payload.units;
    offer.monthly = payload.monthly;
    offer.monthly_discount = payload.monthly_discount;
    return Json(json!(offer));
  }
  Json(json!({"error": "Offre introuvable"}))
}

async fn delete_offer_handler(AxumState(state): AxumState<AppState>, Path(id): Path<i32>) -> Json<serde_json::Value> {
  let mut offers = state.offers.lock().await;
  let initial_len = offers.len();
  offers.retain(|o| o.id != id);
  if offers.len() == initial_len {
    return Json(json!({"error": "Offre introuvable"}));
  }
  Json(json!({"deleted": true}))
}

async fn get_clients(AxumState(state): AxumState<AppState>) -> Json<serde_json::Value> {
  let clients = state.clients.lock().await;
  Json(json!(clients.clone()))
}

async fn get_reservations(AxumState(state): AxumState<AppState>) -> Json<serde_json::Value> {
  let reservations = state.reservations.lock().await;
  Json(json!(reservations.clone()))
}

#[derive(Debug, Serialize)]
struct LogFileInfo {
  name: String,
  size: u64,
  modified: String,
}

#[tauri::command]
fn list_log_files(app: tauri::AppHandle) -> Result<Vec<LogFileInfo>, String> {
  let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
  let mut files: Vec<LogFileInfo> = std::fs::read_dir(&log_dir)
    .map_err(|e| e.to_string())?
    .flatten()
    .filter(|e| {
      e.path().extension().and_then(|x| x.to_str()) == Some("log")
    })
    .filter_map(|e| {
      let meta = e.metadata().ok()?;
      let modified = meta.modified().ok()
        .and_then(|t| {
          let secs = t.duration_since(std::time::UNIX_EPOCH).ok()?.as_secs();
          Some(format_timestamp(secs))
        })
        .unwrap_or_default();
      Some(LogFileInfo {
        name: e.file_name().to_string_lossy().to_string(),
        size: meta.len(),
        modified,
      })
    })
    .collect();

  files.sort_by(|a, b| b.modified.cmp(&a.modified));
  Ok(files)
}

fn format_timestamp(secs: u64) -> String {
  let s = secs;
  let mins   = s / 60; let secs   = s % 60;
  let hours  = mins / 60; let mins   = mins % 60;
  let days   = hours / 24; let hours  = hours % 24;
  let years  = days / 365; let days   = days % 365;
  let months = days / 30;  let days   = days % 30;
  format!("{:04}-{:02}-{:02} {:02}:{:02}:{:02}", 1970 + years, months + 1, days + 1, hours, mins, secs)
}

#[tauri::command]
fn read_log_file(app: tauri::AppHandle, filename: String) -> Result<String, String> {
  // Sécurité : interdire les chemins avec traversal
  if filename.contains('/') || filename.contains('\\') || filename.contains("..") {
    return Err("Nom de fichier invalide.".to_string());
  }
  let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
  let path = log_dir.join(&filename);
  if path.extension().and_then(|e| e.to_str()) != Some("log") {
    return Err("Seuls les fichiers .log sont lisibles.".to_string());
  }
  std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_log_file(app: tauri::AppHandle, filename: String) -> Result<(), String> {
  if filename.contains('/') || filename.contains('\\') || filename.contains("..") {
    return Err("Nom de fichier invalide.".to_string());
  }
  let log_dir = app.path().app_log_dir().map_err(|e| e.to_string())?;
  let path = log_dir.join(&filename);
  if path.extension().and_then(|e| e.to_str()) != Some("log") {
    return Err("Seuls les fichiers .log sont supprimables.".to_string());
  }
  std::fs::remove_file(&path).map_err(|e| e.to_string())
}
