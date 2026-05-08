# my-tauri-app

Application React + Vite + Tauri avec authentification directe en base de donnees (bcrypt) via commandes Tauri.

## Pre-requis

- Node.js 20+
- npm
- Rust / Tauri CLI
- Base MySQL accessible depuis `src-tauri/src/config.rs`

## Configuration

Copiez `.env.example` vers `.env`:

```powershell
Copy-Item .env.example .env
```

Variable front utile:

- `VITE_BACKOFFICE_API_BASE_URL` (par defaut `http://127.0.0.1:3000`)

## Lancer le projet

```powershell
npm install
npm run tauri dev
```

## Authentification

- Le front appelle la commande Tauri `login_db`.
- Le backend Rust lit l'utilisateur en base et verifie le hash bcrypt.
- Les roles sont stockes en session locale pour proteger les routes front.

## Notes utiles

- Le fichier `docs/backlog-client-lourd.md` contient le backlog extrait du PDF.
- Les pages `Tickets` et `Gestion des baies` utilisent des commandes Tauri natives.
- En mode `npm run dev` seul, les fonctionnalites natives Tauri ne sont pas disponibles.
