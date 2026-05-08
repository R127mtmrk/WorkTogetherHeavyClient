# Backlog client lourd (base PDF)

Source: `WorkTogether Data Solutions - SLAM (1).pdf`

## MVP (priorite haute)

- [x] Authentification interne (Symfony API) avec roles
- [x] Controle d'acces par roles (client, comptable, admin)
- [x] Consultation des tickets ouverts (technicien/admin)
- [x] Gestion des baies (admin)
- [x] Tableau de bord comptable de base (stats globales)
- [x] Catalogue d'offres commerciales initial

## Sprint suivant (priorite haute)

- [ ] Gestion utilisateurs (admin)
- [ ] Gestion des offres commerciale en CRUD (admin)
- [ ] Liste clients (comptable)
- [ ] Liste reservations/commandes (comptable)
- [ ] Rapport mensuel des reservations (comptable)
- [ ] Rapport d'occupation des baies (comptable)

## Evolutions (priorite moyenne)

- [ ] Historique d'interventions par unite
- [ ] Vue de placement des unites (B014-U06)
- [ ] Classification des unites (type + couleur)
- [ ] Gestion de support client (tickets)
- [ ] 2FA cote client

## Ecarts identifies a ce stade

- L'API Symfony fournie couvre l'authentification et la verification de role, mais pas encore la gestion complete offres/clients/reservations.
- Le backoffice local (Axum/Tauri) expose deja `/api/tickets/open`, `/api/bays`, `/api/bay`, `/api/stats`.
- Pour finaliser la partie "client lourd complete", il faut etendre les endpoints backoffice ou consommer de nouvelles routes Symfony metier.

## Decoupage recommande

1. Sprint 1: stabilisation auth/roles + ecrans operationnels tickets/baies/stats/offres
2. Sprint 2: CRUD offres + liste clients + liste reservations
3. Sprint 3: reporting comptable avance + historique interventions + optimisations UX

