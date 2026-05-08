# WorkTogether — Documentation Technique

> Application desktop **Tauri v2** + **React** + **Axum** (Rust) connectée à une base **MySQL** (WAMP).

---

## Sommaire

1. [Stack technique](#1-stack-technique)
2. [Structure du projet](#2-structure-du-projet)
3. [Backend Rust — vue d'ensemble](#3-backend-rust--vue-densemble)
   - 3.1 [Séquence de démarrage](#31-séquence-de-démarrage)
   - 3.2 [Configuration BDD (`config.rs`)](#32-configuration-bdd-configrs)
   - 3.3 [Modèles de données (`models.rs`)](#33-modèles-de-données-modelsrs)
   - 3.4 [Couche accès données (`repository.rs`)](#34-couche-accès-données-repositoryrs)
   - 3.5 [Commandes Tauri (`main.rs`)](#35-commandes-tauri-mainrs)
   - 3.6 [Serveur HTTP Axum (`main.rs`)](#36-serveur-http-axum-mainrs)
   - 3.7 [Plugins Tauri enregistrés](#37-plugins-tauri-enregistrés)
   - 3.8 [Gestion des erreurs au démarrage](#38-gestion-des-erreurs-au-démarrage)
   - 3.9 [Système de logs](#39-système-de-logs)
4. [Frontend React — vue d'ensemble](#4-frontend-react--vue-densemble)
   - 4.1 [Routing & authentification](#41-routing--authentification)
   - 4.2 [Pages](#42-pages)
   - 4.3 [Services JS](#43-services-js)
5. [Base de données](#5-base-de-données)
6. [Permissions Tauri](#6-permissions-tauri)
7. [Commandes utiles](#7-commandes-utiles)

---

## 1. Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Shell applicatif | Tauri | 2.10.2 |
| Backend / logique | Rust + Tokio | edition 2021 |
| Serveur HTTP interne | Axum | 0.8.8 |
| Base de données | MySQL via SQLx | 0.8.6 |
| Frontend | React + Vite | React 19, Vite 7 |
| Routing frontend | React Router DOM | 7.x |
| ORM-like | SQLx (query macros) | — |
| Hashage mot de passe | bcrypt | 0.15 |
| Dialogs natifs | tauri-plugin-dialog + rfd | 2.7 / 0.15 |
| Logs | tauri-plugin-log + log | 2.8 / 0.4 |

---

## 2. Structure du projet

```
my-tauri-app/
├── src/                        # Frontend React
│   ├── App.jsx                 # Router principal
│   ├── App.css                 # Styles globaux
│   ├── auth/
│   │   ├── AuthContext.jsx     # Contexte auth (React Context)
│   │   ├── Login.jsx           # Page de connexion
│   │   └── RequireRole.jsx     # Guard de route par rôle
│   ├── components/
│   │   ├── Menu.jsx            # Sidebar de navigation
│   │   ├── BaieCard.jsx        # Carte affichage baie
│   │   └── TicketCard.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Tickets.jsx
│   │   ├── Offers.jsx
│   │   ├── AdminBaies.jsx
│   │   ├── AdminOffers.jsx
│   │   ├── AdminUsers.jsx
│   │   ├── AdminLogs.jsx       # Visionneuse de logs
│   │   ├── ComptableDashboard.jsx
│   │   ├── ComptableClients.jsx
│   │   └── ComptableReservations.jsx
│   └── services/
│       ├── tauri.js            # Wrapper invoke (détection runtime)
│       ├── authApi.js          # Auth, CRUD utilisateurs app_user
│       ├── logger.js           # Service de logging frontend
│       ├── offersApi.js
│       ├── clientsApi.js
│       ├── reservationsApi.js
│       └── backofficeApi.js    # Stats comptable
│
└── src-tauri/
    ├── Cargo.toml              # Dépendances Rust
    ├── tauri.conf.json         # Config Tauri (URLs, bundle, prodName)
    ├── capabilities/
    │   └── default.json        # Permissions accordées à la WebView
    └── src/
        ├── main.rs             # Point d'entrée, commandes Tauri, serveur Axum
        ├── config.rs           # URL BDD, connexion pool
        ├── models.rs           # Structs SQLx (FromRow)
        └── repository.rs       # Toutes les requêtes SQL
```

---

## 3. Backend Rust — vue d'ensemble

### 3.1 Séquence de démarrage

```
main()
  │
  ├─ init_db_pool()          ← essaie de se connecter (timeout 3s)
  │     ├─ OK → continue
  │     └─ FAIL → dialog d'avertissement
  │               → net start wampmysqld64
  │               → retry toutes les 2s pendant 30s
  │               → FAIL → dialog d'erreur + exit(1)
  │
  ├─ repo.run_migration()    ← CREATE TABLE IF NOT EXISTS app_user
  │                             ALTER TABLE bay ADD COLUMN ... (idempotent)
  │
  ├─ ensure_initial_admin()  ← si app_user vide → crée admin@local.test / admin123!
  │
  ├─ AppState::new()         ← données en mémoire (offres, clients, réservations)
  │
  ├─ Axum Router::new()      ← serveur HTTP sur 127.0.0.1:3000 (task::spawn)
  │
  ├─ [dev] attente Vite      ← polling TCP sur :5173 (max 20 × 500ms)
  │
  └─ tauri::Builder::default()
        .plugin(log)         ← fichiers dans %APPDATA%/.../logs/
        .plugin(dialog)
        .setup(cleanup_old_logs + log::info démarrage)
        .manage(repo)
        .invoke_handler(...)
        .run()
```

> **Important :** `AppState` (offres, clients, réservations fictives) est entièrement en mémoire et remis à zéro à chaque lancement. Seuls `app_user`, `bay` et `ticket` persistent en BDD.

---

### 3.2 Configuration BDD (`config.rs`)

**Priorité de l'URL de connexion :**

```
1. Variable d'environnement  DATABASE_URL
2. Fichier                   %APPDATA%\WorkTogether\.env  (clé DATABASE_URL=...)
3. Valeur par défaut         mysql://root:@localhost:3306/worktogether
```

**Fonctions publiques :**

| Fonction | Description |
|---|---|
| `get_database_url() -> String` | Résout l'URL selon la priorité ci-dessus |
| `try_connect() -> Result<MySqlPool>` | Pool avec timeout 3s — utilisé au démarrage pour détecter rapidement si MySQL est absent |

**Changer la BDD sans recompiler :**
Créer `%APPDATA%\WorkTogether\.env` avec :
```
DATABASE_URL=mysql://user:pass@host:3306/ma_base
```

---

### 3.3 Modèles de données (`models.rs`)

Toutes les structs implémentent `serde::Serialize` et `sqlx::FromRow`.

```rust
// Table propre à l'app Tauri
struct AppUser { id, email, username, password, roles: String/*JSON*/, is_active: i8 }

// Table Symfony
struct Ticket { id, client_id, title, description, priority, status, assigned_to }

// Table Symfony
struct Bay { id, name_bay, units_total: i64, units_free: i64 }

// Calculé en Rust depuis plusieurs requêtes
struct ComptableStats { total_baies, total_offres, total_commandes, taux_occupation: f64 }
```

> `roles` dans `AppUser` est stocké comme JSON string en MySQL (`["ROLE_ADMIN","ROLE_USER"]`) et désérialisé côté Rust/JS à la lecture.

---

### 3.4 Couche accès données (`repository.rs`)

La struct `Repo` contient un `MySqlPool` et expose des méthodes `async`.

#### Utilisateurs app Tauri (`app_user`)
| Méthode | SQL |
|---|---|
| `count_app_users()` | `SELECT COUNT(*)` |
| `get_app_user(email)` | `SELECT ... WHERE email = ?` |
| `create_app_user(email, username, hash, roles_json)` | `INSERT INTO app_user` |
| `delete_app_user(id)` | `DELETE FROM app_user WHERE id = ?` |
| `run_migration()` | `CREATE TABLE IF NOT EXISTS app_user` + `ALTER TABLE bay ADD COLUMN` |

#### Tickets
| Méthode | SQL |
|---|---|
| `get_tickets_open()` | `SELECT * FROM ticket WHERE status='open' ORDER BY id DESC` |
| `close_ticket(id)` | `UPDATE ticket SET status = 'closed' WHERE id = ?` |

#### Baies
| Méthode | SQL |
|---|---|
| `create_bay(name, units_total)` | `INSERT INTO bay` — initialise `units_free = units_total` |
| `delete_bay(id)` | `DELETE FROM bay WHERE id = ?` |
| `get_bays()` | `SELECT` avec `LEFT JOIN unit` — calcule l'occupation réelle via `GREATEST` |

#### Stats comptable
| Méthode | Calcul |
|---|---|
| `get_comptable_stats()` | 4 requêtes séparées : `COUNT(bay)`, `COUNT(offer)`, `COUNT(order)`, taux d'occupation moyen |

---

### 3.5 Commandes Tauri (`main.rs`)

Les commandes Tauri sont invoquées depuis le frontend via `invoke("nom_commande", { args })`.

| Commande | Arguments | Retour | Description |
|---|---|---|---|
| `get_tickets` | — | `Vec<Ticket>` | Tickets ouverts |
| `close_ticket` | `id: i32` | `()` | Ferme un ticket |
| `get_baies` | — | `Vec<Bay>` | Liste des baies |
| `add_baie` | `name: String, units_total: Option<i32>` | `i32` (id) | Crée une baie |
| `delete_baie` | `id: i32` | `()` | Supprime une baie |
| `login_db` | `identifier: String, password: String` | `AuthUserDto` | Authentification bcrypt |
| `list_app_users` | — | `Vec<AppUserListItem>` | Liste des comptes app |
| `create_app_user` | `payload: CreateAppUserPayload` | `i64` (id) | Crée un compte (hash bcrypt) |
| `delete_app_user` | `id: i32` | `()` | Supprime un compte |
| `list_log_files` | — | `Vec<LogFileInfo>` | Fichiers .log triés par date |
| `read_log_file` | `filename: String` | `String` | Contenu d'un fichier .log |
| `delete_log_file` | `filename: String` | `()` | Supprime un fichier .log |

**Structs de réponse importantes :**

```rust
// Retourné par login_db
struct AuthUserDto { id, email, username, roles: Vec<String> }

// Retourné par list_app_users
struct AppUserListItem { id, email, username, roles: Vec<String>, is_active: bool }

// Retourné par list_log_files
struct LogFileInfo { name: String, size: u64, modified: String }
```

**Compatibilité bcrypt PHP/Symfony :**
`verify_bcrypt_password()` normalise les hashs `$2y$` (PHP) en `$2b$` (Rust) avant vérification.

**Sécurité `read_log_file` / `delete_log_file` :**
- Interdit `/`, `\`, `..` dans le nom de fichier
- Vérifie que l'extension est `.log`
- Le chemin est toujours construit depuis `app_log_dir()` — jamais depuis l'input brut

---

### 3.6 Serveur HTTP Axum (`main.rs`)

Tourne en tâche de fond sur **`127.0.0.1:3000`** via `task::spawn`. Utilisé par les pages comptable/offres/clients via des `fetch()` classiques (non-Tauri).

| Route | Méthode | Handler |
|---|---|---|
| `/api/tickets/open` | GET | Tickets ouverts (depuis BDD) |
| `/api/bays` | GET | Baies (depuis BDD) |
| `/api/bay` | POST | Crée une baie |
| `/api/stats` | GET | Stats comptable |
| `/api/offers` | GET / POST | Offres en mémoire |
| `/api/offers/{id}` | PUT / DELETE | Modif/suppression en mémoire |
| `/api/clients` | GET | Clients en mémoire |
| `/api/reservations` | GET | Réservations en mémoire |

> Le middleware `CorsLayer::permissive()` est actif — à restreindre en production si l'app est exposée.

---

### 3.7 Plugins Tauri enregistrés

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new()   // Logs fichiers
        .target(TargetKind::LogDir { file_name: Some("worktogether") })
        .max_file_size(5_000_000)              // 5 Mo par fichier
        .rotation_strategy(RotationStrategy::KeepAll)
        .build())
    .plugin(tauri_plugin_dialog::init())       // Dialogs natifs (ask, confirm, message)
    .setup(|app| {
        cleanup_old_logs(&app.path().app_log_dir()?); // Supprime les .log > 30j
        log::info!("WorkTogether démarré");
        Ok(())
    })
```

---

### 3.8 Gestion des erreurs au démarrage

Deux mécanismes coexistent :

**Avant que Tauri démarre** → `rfd::MessageDialog` (boîte de dialogue Win32 native, sans WebView)
- Utilisé par `init_db_pool()` et la migration
- Ne nécessite pas que l'`AppHandle` soit disponible

**Après que Tauri démarre** → `tauri-plugin-dialog` (`ask()` côté JS)
- Utilisé pour les confirmations utilisateur dans l'UI

---

### 3.9 Système de logs

**Emplacement des fichiers :**
```
Windows : %APPDATA%\fr.worktogether.backoffice\logs\worktogether.log
```

**Rotation :**
- Nouveau fichier créé quand le précédent dépasse 5 Mo (`KeepAll` = tous les fichiers sont conservés)
- Nettoyage automatique au démarrage : tout `.log` dont la date de modification est > 30 jours est supprimé

**Niveaux disponibles :**
`TRACE` < `DEBUG` < `INFO` < `WARN` < `ERROR`

**Depuis le frontend (JS) :**
```js
import { logger } from "../services/logger";

logger.info("message simple");
logger.action("Nom de l'action", { clé: "valeur" }); // → [ACTION] ...
logger.auth("Connexion réussie", { email });           // → [AUTH] ...
logger.warn("attention", { contexte });
logger.error("erreur critique", { détail });
```

**Actions déjà loguées automatiquement :**
| Événement | Niveau | Préfixe |
|---|---|---|
| Connexion réussie | INFO | `[AUTH]` |
| Déconnexion | INFO | `[AUTH]` |
| Création utilisateur | INFO | `[ACTION]` |
| Suppression utilisateur | INFO | `[ACTION]` |
| Ajout baie | INFO | `[ACTION]` |
| Suppression baie | INFO | `[ACTION]` |
| Création offre | INFO | `[ACTION]` |
| Modification offre | INFO | `[ACTION]` |
| Suppression offre | INFO | `[ACTION]` |
| Démarrage application | INFO | — |

---

## 4. Frontend React — vue d'ensemble

### 4.1 Routing & authentification

- `AuthContext.jsx` stocke l'utilisateur en `localStorage` (clé `desktop_auth_user`)
- `RequireRole` redirige vers `/` si le rôle requis n'est pas présent
- La connexion passe par la commande Tauri `login_db` (pas d'API HTTP)

**Rôles disponibles :**
| Valeur | Label | Accès |
|---|---|---|
| `ROLE_ADMIN` | Administrateur | Tout |
| `ROLE_COMPTABLE` | Comptable | Comptabilité + offres |
| `ROLE_TECHNICIEN` | Technicien | Tickets |

---

### 4.2 Pages

| Route | Composant | Rôles | Description |
|---|---|---|---|
| `/dashboard` | `Dashboard` | Tous | Accueil, quick-links, stats |
| `/offers` | `Offers` | Tous | Catalogue d'offres (lecture) |
| `/tickets` | `Tickets` | ADMIN, TECHNICIEN | Gestion tickets ouverts |
| `/admin/baies` | `AdminBaies` | ADMIN | CRUD baies serveur |
| `/admin/offres` | `AdminOffers` | ADMIN | CRUD offres commerciales |
| `/admin/utilisateurs` | `AdminUsers` | ADMIN | CRUD comptes app_user |
| `/admin/logs` | `AdminLogs` | ADMIN | Visionneuse logs |
| `/comptable` | `ComptableDashboard` | ADMIN, COMPTABLE | Stats générales |
| `/comptable/clients` | `ComptableClients` | ADMIN, COMPTABLE | Liste clients |
| `/comptable/reservations` | `ComptableReservations` | ADMIN, COMPTABLE | Réservations |

---

### 4.3 Services JS

| Fichier | Rôle | Transport |
|---|---|---|
| `tauri.js` | Wrapper `invoke` avec détection runtime Tauri | Tauri IPC |
| `authApi.js` | Login, logout, CRUD app_user | Tauri IPC |
| `logger.js` | Log frontend via tauri-plugin-log | Tauri IPC |
| `offersApi.js` | CRUD offres | HTTP → :3000 |
| `clientsApi.js` | Liste clients | HTTP → :3000 |
| `reservationsApi.js` | Liste réservations | HTTP → :3000 |
| `backofficeApi.js` | Stats comptable | HTTP → :3000 |

---

## 5. Base de données

**Connexion par défaut :** `mysql://root:@localhost:3306/worktogether`

**Tables utilisées :**

| Table | Origine | Gérée par |
|---|---|---|
| `app_user` | Tauri (auto-migrée) | `repository.rs::run_migration()` |
| `bay` | Symfony | + colonnes `units_total`, `units_free` ajoutées par migration |
| `unit` | Symfony | Lecture seule (occupation baies) |
| `ticket` | Symfony | Lecture + mise à jour status |
| `offer` | Symfony | Lecture seule |
| `order` | Symfony | Lecture seule (stats) |
| `user` | Symfony | Non utilisée directement (authentification via `app_user`) |

**Migration automatique au démarrage (`run_migration`) :**
```sql
CREATE TABLE IF NOT EXISTS app_user (...)   -- idempotent
ALTER TABLE bay ADD COLUMN units_total ...  -- ignoré si déjà présent
ALTER TABLE bay ADD COLUMN units_free  ...  -- ignoré si déjà présent
```

**Compte admin initial (premier lancement uniquement) :**
```
email    : admin@local.test
password : admin123!
roles    : ["ROLE_ADMIN", "ROLE_USER"]
```
> À changer immédiatement après la première connexion.

---

## 6. Permissions Tauri

Fichier : `src-tauri/capabilities/default.json`

```json
{
  "permissions": [
    "core:default",
    "core:window:allow-destroy",
    "core:event:allow-listen",
    "core:event:allow-unlisten",
    "dialog:allow-ask",
    "dialog:allow-confirm",
    "dialog:allow-message",
    "log:allow-log"
  ]
}
```

> Pour ajouter une fonctionnalité Tauri (accès fichiers, notifications…), ajouter la permission correspondante ici **et** enregistrer le plugin dans `main.rs`.

---

## 7. Commandes utiles

```bash
# Développement (démarre Vite + Tauri)
cd my-tauri-app
npm run tauri dev

# Build production (génère le .exe autonome)
npm run tauri build
# Résultat : src-tauri/target/release/WorkTogether.exe
# Installeur : src-tauri/target/release/bundle/

# Build frontend seul
npm run build

# Vérification Rust sans compiler le binaire final (rapide)
cd src-tauri && cargo check

# Rebuild Rust propre (lent, ~15 min)
cd src-tauri && cargo clean && cd .. && npm run tauri build

# Voir les logs en direct (PowerShell)
Get-Content "$env:APPDATA\fr.worktogether.backoffice\logs\worktogether.log" -Wait
```

**Prérequis pour que le `.exe` fonctionne :**
- WAMP démarré (MySQL sur le port 3306) — ou le service `wampmysqld64` doit pouvoir être lancé par l'application (droits admin requis)
- Base de données `worktogether` existante avec le schéma Symfony déployé
- WebView2 installé sur le poste (pré-installé sur Windows 11)
