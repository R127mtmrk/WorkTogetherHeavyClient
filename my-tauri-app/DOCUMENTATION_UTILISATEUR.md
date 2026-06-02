# WorkTogether — Guide Utilisateur

> Manuel d'utilisation de l'application de backoffice **WorkTogether Data Solutions**.

**Version de l'application :** 1.0.0
**Public visé :** administrateurs, comptables et techniciens utilisant l'application au quotidien.
**Aucune compétence technique n'est requise** pour suivre ce guide.
**Dernière mise à jour :** 29 mai 2026

---

## Sommaire

1. [Bienvenue](#1-bienvenue)
2. [À qui s'adresse ce guide](#2-à-qui-sadresse-ce-guide)
3. [Premiers pas](#3-premiers-pas)
4. [Se connecter et se déconnecter](#4-se-connecter-et-se-déconnecter)
5. [Découvrir l'interface](#5-découvrir-linterface)
6. [Comprendre les rôles et les accès](#6-comprendre-les-rôles-et-les-accès)
7. [Le tableau de bord](#7-le-tableau-de-bord)
8. [Consulter les offres](#8-consulter-les-offres)
9. [Gérer les tickets](#9-gérer-les-tickets)
10. [Espace administration](#10-espace-administration)
    - 10.1 [Gestion des baies](#101-gestion-des-baies)
    - 10.2 [Gestion des offres](#102-gestion-des-offres)
    - 10.3 [Gestion des utilisateurs](#103-gestion-des-utilisateurs)
    - 10.4 [Journaux d'activité](#104-journaux-dactivité)
11. [Espace comptable](#11-espace-comptable)
    - 11.1 [Tableau de bord comptable](#111-tableau-de-bord-comptable)
    - 11.2 [Clients](#112-clients)
    - 11.3 [Réservations](#113-réservations)
12. [Procédures pas à pas](#12-procédures-pas-à-pas)
13. [Questions fréquentes (FAQ)](#13-questions-fréquentes-faq)
14. [Résolution de problèmes](#14-résolution-de-problèmes)
15. [Glossaire](#15-glossaire)

---

## 1. Bienvenue

**WorkTogether** est l'application de bureau qui centralise la gestion de l'activité de WorkTogether Data Solutions. Elle vous permet, selon votre profil, de :

- suivre l'occupation des **baies** du datacenter ;
- gérer les **tickets** d'assistance des clients ;
- consulter et administrer le **catalogue d'offres** commerciales ;
- piloter la **comptabilité** (clients, réservations, chiffre d'affaires) ;
- administrer les **comptes utilisateurs** de l'application ;
- consulter les **journaux d'activité**.

L'application s'installe et s'exécute directement sur votre poste Windows. Elle se connecte à la base de données de l'entreprise pour récupérer et enregistrer les informations.

> 💡 Ce guide décrit **toutes** les fonctionnalités. Selon votre rôle, certaines sections ne vous concerneront pas — elles sont clairement indiquées.

---

## 2. À qui s'adresse ce guide

Ce guide est destiné aux trois profils d'utilisateurs de l'application :

| Profil | Ce que vous pouvez faire |
|---|---|
| **Administrateur** | Tout : baies, offres, utilisateurs, journaux, comptabilité, tickets |
| **Comptable** | Comptabilité, clients, réservations, consultation des offres |
| **Technicien** | Tickets d'assistance, consultation des offres |

Chaque utilisateur dispose d'un **compte personnel** (adresse email + mot de passe) créé par un administrateur. L'interface s'adapte automatiquement à vos droits : vous ne voyez que les menus auxquels vous avez accès.

---

## 3. Premiers pas

### 3.1 Lancer l'application

1. Assurez-vous que **MariaDB est démarré** sur la machine distante Linux (Depuis un terminal administrateur, éxécuté "telnet 10.192.72.20 3306"). WAMP héberge la base de données dont l'application a besoin.
2. Double-cliquez sur l'icône **WorkTogether**.
3. L'application s'ouvre dans une fenêtre intitulée *WorkTogether — Backoffice*.

> ⚙️ **Démarrage automatique de la base.** Si la base de données n'est pas disponible, l'application tente de la démarrer toute seule. Un message vous prévient et l'application patiente jusqu'à 30 secondes. Si rien ne se passe, voir [Résolution de problèmes](#14-résolution-de-problèmes).

### 3.2 La toute première connexion

Lors de la **première utilisation** de l'application sur une base vierge, un compte administrateur est créé automatiquement pour vous permettre d'entrer :

| Champ | Valeur |
|---|---|
| **Adresse email** | `admin@local.test` |
| **Mot de passe** | `admin123!` |

> 🔒 **Important — sécurité.** Ce compte par défaut est connu de tous. Dès votre première connexion, créez votre propre compte administrateur (voir §10.3), puis supprimez ou faites supprimer le compte `admin@local.test`.

---

## 4. Se connecter et se déconnecter

### 4.1 Connexion

À l'ouverture, l'écran de connexion s'affiche :

```
   ┌─────────────────────────────┐
   │            W                │
   │       WorkTogether          │
   │ Data Solutions — Backoffice │
   │                             │
   │  ┌───────────────────────┐  │
   │  │ Connexion             │  │
   │  │ Adresse email         │  │
   │  │ [____________________]│  │
   │  │ Mot de passe          │  │
   │  │ [____________________]│  │
   │  │   [  Se connecter  ]  │  │
   │  └───────────────────────┘  │
   └─────────────────────────────┘
```

1. Saisissez votre **adresse email**.
2. Saisissez votre **mot de passe**.
3. Cliquez sur **Se connecter** (ou appuyez sur Entrée).

Si les informations sont correctes, vous êtes dirigé vers le **tableau de bord**.

**Messages d'erreur possibles :**

| Message | Signification |
|---|---|
| « Veuillez renseigner votre email et mot de passe. » | Un champ est vide. |
| « Identifiant ou mot de passe invalide. » | Email inconnu ou mot de passe incorrect. |
| « Ce compte est désactivé. » | Votre compte a été désactivé par un administrateur. |

> 💡 Pour des raisons de sécurité, le message ne précise jamais lequel des deux champs est erroné.

### 4.2 Déconnexion

Pour vous déconnecter, cliquez sur le bouton **🚪 Déconnexion** en bas de la barre latérale gauche. Vous revenez à l'écran de connexion.

> ℹ️ **Déconnexion automatique.** Par sécurité, vous êtes automatiquement déconnecté lorsque vous **fermez l'application**. Vous devrez donc vous reconnecter à chaque lancement. Ce comportement est volontaire.

---

## 5. Découvrir l'interface

Une fois connecté, l'application se présente en deux zones :

```
┌─────────────────┬───────────────────────────────────────────┐
│   BARRE         │                                           │
│   LATÉRALE      │            ZONE DE CONTENU                │
│                 │                                           │
│  W WorkTogether │   Titre de la page                        │
│                 │   Sous-titre                              │
│  Général        │   ─────────────────────────────────────   │
│   🏠 Dashboard  │                                           │
│   📦 Offres     │   [ Statistiques / KPI ]                  │
│                 │                                           │
│  Support        │   [ Tableaux, cartes, formulaires ]       │
│   🎫 Tickets    │                                           │
│                 │                                           │
│  Comptabilité   │                                           │
│   📊 …          │                                           │
│                 │                                           │
│  Administration │                                           │
│   🖥️ Baies      │                                           │
│   …             │                                           │
│                 │                                           │
│  [Avatar] Nom   │                                           │
│  🚪 Déconnexion │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

### 5.1 La barre latérale (menu de gauche)

Elle contient :

- le **logo** WorkTogether en haut ;
- les **sections de navigation**, regroupées par thème : *Général*, *Support*, *Comptabilité*, *Administration* ;
- en bas, votre **profil** (initiales, nom, rôle principal) et le bouton de **déconnexion**.

> 👁️ **Les menus s'adaptent à votre rôle.** Vous ne verrez que les sections auxquelles vous avez droit. Un technicien ne voit pas la section *Comptabilité*, par exemple.

### 5.2 La zone de contenu

C'est l'espace principal où s'affiche la page sélectionnée. La plupart des pages comportent :

- un **en-tête** (titre + courte description) ;
- éventuellement un bouton **↻ Actualiser** pour recharger les données ;
- des **cartes de statistiques** (KPI) en haut ;
- le **contenu principal** : tableau, liste de cartes, ou formulaire.

### 5.3 Codes couleurs des badges

L'application utilise des badges colorés pour communiquer rapidement une information :

| Couleur | Signification générale |
|---|---|
| 🟢 Vert | Positif / actif / disponible / occupation faible |
| 🟠 Orange | Attention / priorité moyenne-haute / occupation moyenne |
| 🔴 Rouge | Critique / saturé / inactif / occupation forte |
| 🔵 Bleu | Information / catégorie |
| ⚪ Gris | Neutre / clôturé / libre |

---

## 6. Comprendre les rôles et les accès

Chaque compte possède un ou plusieurs **rôles** qui déterminent ce à quoi vous avez accès.

### 6.1 Les rôles disponibles

| Rôle | Libellé affiché | Couleur du badge |
|---|---|---|
| `ROLE_ADMIN` | Administrateur | 🔴 Rouge |
| `ROLE_COMPTABLE` | Comptable | 🔵 Bleu |
| `ROLE_TECHNICIEN` | Technicien | 🟠 Orange |
| `ROLE_USER` | Utilisateur | ⚪ Gris |

### 6.2 Matrice des accès

| Fonctionnalité | Administrateur | Comptable | Technicien |
|---|:---:|:---:|:---:|
| Tableau de bord | ✅ | ✅ | ✅ |
| Offres (consultation) | ✅ | ✅ | ✅ |
| Tickets | ✅ | ❌ | ✅ |
| Comptabilité (tableau de bord) | ✅ | ✅ | ❌ |
| Clients | ✅ | ✅ | ❌ |
| Réservations | ✅ | ✅ | ❌ |
| Gestion des baies | ✅ | ❌ | ❌ |
| Gestion des offres | ✅ | ❌ | ❌ |
| Gestion des utilisateurs | ✅ | ❌ | ❌ |
| Journaux d'activité | ✅ | ❌ | ❌ |

> ℹ️ Si vous tentez d'accéder à une page interdite (via une adresse directe), l'application affiche **« Acces refuse »**.

---

## 7. Le tableau de bord

Le tableau de bord (**🏠 Dashboard**) est votre page d'accueil. Son contenu s'adapte à votre rôle.

### 7.1 En-tête personnalisé

En haut, un message d'accueil tient compte de l'heure de la journée :

- **Bonjour** le matin (avant midi) ;
- **Bon après-midi** l'après-midi ;
- **Bonsoir** le soir (après 18 h).

Il est suivi de la date du jour et de vos badges de rôle.

### 7.2 Vue d'ensemble (KPI)

Selon votre profil, des indicateurs clés s'affichent :

| Indicateur | Visible par | Description |
|---|---|---|
| 🎫 Tickets ouverts | Admin, Technicien | Nombre de tickets en attente de traitement |
| 🖥️ Baies | Admin, Comptable | Nombre total de baies |
| 📦 Offres actives | Admin, Comptable | Nombre d'offres au catalogue |
| 📋 Commandes | Admin, Comptable | Nombre total de commandes |
| 📊 Taux d'occupation | Admin, Comptable | Pourcentage moyen d'occupation des baies |

La couleur du taux d'occupation change selon le niveau : vert (faible), orange (moyen, ≥ 60 %), rouge (élevé, ≥ 90 %).

### 7.3 Listes récentes

- **Tickets ouverts** (techniciens/admins) : les 4 tickets ouverts les plus récents, avec un lien « Gérer les tickets → ».
- **Réservations récentes** (comptables/admins) : les 4 dernières réservations, avec montant mensuel et statut.

### 7.4 Accès rapides

Une grille de raccourcis vous mène directement aux pages les plus utiles selon votre rôle (Offres, Comptabilité, Réservations, Gestion des offres, Utilisateurs…).

---

## 8. Consulter les offres

La page **📦 Offres** affiche le **catalogue commercial** en lecture seule. Elle est accessible à tous les utilisateurs connectés.

### 8.1 Statistiques

Trois cartes résument le catalogue :

- **Offres disponibles** : nombre total d'offres ;
- **À partir de** : prix mensuel le plus bas ;
- **Jusqu'à** : prix mensuel le plus élevé.

### 8.2 Le tableau des offres

| Colonne | Description |
|---|---|
| **Offre** | Nom de l'offre (ex. Base, Start-up, PME, Entreprise) |
| **Unités** | Nombre d'unités incluses |
| **Prix mensuel** | Tarif mensuel en euros |
| **Remise** | Pourcentage de remise mensuelle, le cas échéant |
| **Prix annuel (−10 %)** | Tarif annuel avec 10 % de réduction appliquée |

> 💡 Le **prix annuel** affiché correspond à 12 mensualités avec une réduction de 10 % (engagement annuel).

### 8.3 Actualiser

Le bouton **↻ Actualiser** recharge la liste depuis le serveur.

> ⚠️ **À savoir.** Les offres affichées ici sont gérées en mémoire par l'application. Toute modification effectuée dans *Gestion des offres* (réservée aux administrateurs) est **réinitialisée au redémarrage** de l'application.

---

## 9. Gérer les tickets

La page **🎫 Tickets** (Administrateurs et Techniciens) permet de suivre et traiter les demandes d'assistance des clients.

### 9.1 Statistiques

En haut, quatre cartes :

- **Tickets ouverts** (orange si > 0, vert sinon) ;
- **Critiques** (rouge) — affichée seulement s'il y a des tickets critiques à traiter en priorité ;
- **Clôturés** ;
- **Total**.

### 9.2 Filtrer les tickets

Trois boutons de filtre permettent d'afficher :

- **Ouverts** : les tickets à traiter (filtre par défaut) ;
- **Clôturés** : les tickets déjà résolus ;
- **Tous** : l'ensemble.

Les tickets sont automatiquement **triés par priorité** : Critique, puis Haute, Moyenne, Basse.

### 9.3 Lire un ticket

Chaque ticket s'affiche sous forme de carte :

- une **pastille de couleur** indique la priorité ;
- le **titre** et la **description** ;
- des **badges** priorité et statut ;
- les **références** : numéro de ticket, numéro de client, et éventuellement la personne assignée.

| Priorité | Libellé |
|---|---|
| `critical` | Critique 🔴 |
| `high` | Haute 🟠 |
| `medium` | Moyenne 🔵 |
| `low` | Basse ⚪ |

| Statut | Libellé |
|---|---|
| `open` | Ouvert 🟠 |
| `in_progress` | En cours 🔵 |
| `closed` | Clôturé ⚪ |

### 9.4 Clôturer un ticket

Sur un ticket ouvert, cliquez sur **✓ Clôturer**. Le ticket passe immédiatement au statut « Clôturé » et la liste se met à jour.

> ℹ️ La clôture est **immédiate et enregistrée** en base. Un ticket clôturé apparaît grisé et ne peut plus être rouvert depuis l'application.

### 9.5 Aucun ticket

Si aucun ticket n'est ouvert, un message « 🎉 Aucun ticket ouvert — Tout est en ordre » s'affiche.

---

## 10. Espace administration

Cette section est **réservée aux administrateurs**. Elle regroupe la gestion des baies, des offres, des utilisateurs et des journaux.

### 10.1 Gestion des baies

Page **🖥️ Baies** — administration des baies serveur du datacenter et suivi de leur occupation.

#### Statistiques globales

Quatre cartes affichent :

- **Baies totales** ;
- **Unités totales** (somme des capacités) ;
- **Unités libres** ;
- **Taux d'occupation** global (couleur selon le niveau).

#### Liste des baies

Chaque baie est présentée sous forme de carte comprenant :

- le **nom** de la baie et son identifiant ;
- un **badge de pourcentage** d'occupation ;
- une **barre de progression** colorée (verte sous 60 %, orange sous 90 %, rouge au-delà) ;
- les chiffres : **Total**, **Utilisées**, **Libres**.

> 💡 Au tout premier démarrage sur une base vierge, 30 baies nommées **B001** à **B030** (42 unités chacune) sont créées automatiquement.

#### Ajouter une baie

Dans le panneau de droite « Ajouter une baie » :

1. Saisissez le **Nom** (obligatoire), ex. `B#31`.
2. Saisissez le nombre d'**Unités totales** (obligatoire), ex. `42`.
3. Cliquez sur **➕ Ajouter la baie**.

Un message vert confirme l'ajout, et la baie apparaît dans la liste.

#### Supprimer une baie

Cliquez sur l'icône **🗑** en haut à droite de la carte d'une baie. Une fenêtre de confirmation s'ouvre :

> *« Supprimer la baie "B003" ? Cette action est irréversible. »*

Confirmez pour supprimer définitivement la baie.

> ⚠️ La suppression est **définitive**. Vérifiez qu'aucun équipement n'est rattaché à la baie avant de la supprimer.

### 10.2 Gestion des offres

Page **🛒 Gestion Offres** — création, modification et suppression du catalogue commercial.

#### Statistiques

- **Offres au catalogue** : nombre total ;
- **Offres actives** : offres actuellement utilisées par une réservation ;
- **Prix moyen** : tarif mensuel moyen.

#### Le catalogue

Le tableau liste chaque offre avec son nom, ses unités, son prix mensuel, sa remise, et un **statut** :

- **Actif** 🟢 : l'offre est utilisée par au moins une réservation ;
- **Libre** ⚪ : l'offre n'est liée à aucune réservation.

#### Créer une offre

Dans le panneau « Nouvelle offre » :

1. **Nom de l'offre** (obligatoire), ex. `Pro`.
2. **Unités** (obligatoire), ex. `5`.
3. **Prix / mois (€)** (obligatoire), ex. `450`.
4. **Remise mensuelle (%)** (facultatif) — un aperçu du prix après remise s'affiche.
5. Cliquez sur **Créer l'offre**.

#### Modifier une offre

Cliquez sur **✎ Éditer** dans la ligne de l'offre. Le formulaire passe en *mode édition* (bandeau bleu) et se pré-remplit. Modifiez les champs puis cliquez sur **Enregistrer**. Le bouton **✕** annule l'édition.

#### Supprimer une offre

Cliquez sur **✕** dans la ligne de l'offre, puis confirmez.

> ⚠️ Une offre **utilisée par une réservation** ne peut pas être supprimée : le bouton est grisé. Cela évite de casser des réservations existantes.

> ⚠️ **À savoir.** Les offres sont gérées en mémoire : créations, modifications et suppressions sont **perdues au redémarrage** de l'application.

### 10.3 Gestion des utilisateurs

Page **👤 Utilisateurs** — gestion des comptes de connexion à l'application.

#### Liste des comptes

Le tableau présente chaque compte : **ID**, **Email**, **Username**, **Rôles** (badges colorés) et **Statut** (Actif / Inactif).

#### Créer un compte

Dans le panneau « Nouveau compte » :

1. **Adresse email** (obligatoire) — sert d'identifiant de connexion.
2. **Nom d'utilisateur** (facultatif).
3. **Mot de passe** (obligatoire, **minimum 6 caractères**). Un indicateur signale si le mot de passe est trop court. L'icône 👁 permet d'afficher/masquer le mot de passe.
4. **Rôle** — choisissez Administrateur, Comptable ou Technicien.
5. Cliquez sur **Créer le compte**.

> 🔒 **Création d'un administrateur.** Si vous choisissez le rôle Administrateur, une confirmation supplémentaire vous rappelle qu'un administrateur a accès à **toutes** les fonctionnalités.

#### Supprimer un compte

Cliquez sur **✕** dans la ligne du compte, puis confirmez. Si le compte est administrateur, un avertissement spécifique s'affiche.

> ⚠️ Ne supprimez jamais le **dernier compte administrateur** : vous ne pourriez plus administrer l'application via l'interface. En cas de blocage, un technicien peut recréer un compte avec l'outil `create-admin` (voir documentation technique).

#### Bonne pratique de premier démarrage

1. Connectez-vous avec `admin@local.test` / `admin123!`.
2. Créez votre propre compte administrateur (email professionnel, mot de passe fort).
3. Déconnectez-vous, reconnectez-vous avec votre nouveau compte.
4. Supprimez le compte `admin@local.test`.

### 10.4 Journaux d'activité

Page **📄 Journaux** — consultation des fichiers de logs de l'application. Utile pour suivre l'activité ou diagnostiquer un incident.

#### Sélectionner un fichier

Un menu déroulant liste les fichiers de logs disponibles, avec leur **taille** et leur **date** de modification. Le plus récent est sélectionné par défaut.

> ℹ️ Les fichiers de logs **de plus de 30 jours sont supprimés automatiquement** au démarrage de l'application.

#### Lire et filtrer

- Des **compteurs** indiquent le nombre de lignes INFO, WARN et ERROR.
- Les boutons **ALL / INFO / WARN / ERROR** filtrent par niveau de gravité.
- Le champ **Rechercher…** filtre les lignes contenant un texte donné.
- La case **Scroll auto** fait défiler automatiquement vers les dernières lignes.

#### Lecture facilitée

L'application **traduit automatiquement** les opérations techniques en phrases compréhensibles. Par exemple, une ligne technique de lecture de tickets s'affiche comme « *Lecture des tickets ouverts* », une création de compte comme « *Création d'un compte utilisateur* », etc.

#### Supprimer un fichier

Le bouton **🗑 Supprimer** efface le fichier de log actuellement sélectionné, après confirmation.

> ⚠️ La suppression est **irréversible**. Ne supprimez un journal que si vous êtes certain de ne plus en avoir besoin.

---

## 11. Espace comptable

Cette section est accessible aux **Administrateurs** et aux **Comptables**.

### 11.1 Tableau de bord comptable

Page **📊 Tableau de bord** — vue financière et analytique de l'activité.

#### Indicateurs clés

| Indicateur | Description |
|---|---|
| 💶 **Revenu mensuel actif** | Somme des montants des réservations actives |
| 📋 **Commandes totales** | Nombre total de commandes (et nombre d'inactives) |
| 👥 **Clients** | Nombre de clients enregistrés |
| 📦 **Offres disponibles** | Nombre d'offres au catalogue |
| 🖥️ **Baies** | Nombre de baies |
| 📊 **Taux d'occupation** | Pourcentage moyen d'occupation des baies |

#### Analyses

- **Réservations récentes** : les 5 dernières réservations avec client, offre, période et montant.
- **Top clients (revenu)** : classement des meilleurs clients par chiffre d'affaires, avec barres de proportion.
- **Répartition des réservations** : proportion d'actives vs inactives.

### 11.2 Clients

Page **👥 Clients** — répertoire des clients.

#### Statistiques

- **Clients enregistrés** : nombre total ;
- **Sociétés distinctes** : nombre d'entreprises différentes.

#### Rechercher un client

Le champ de recherche 🔍 filtre instantanément par **nom**, **email** ou **société**. Le bouton **✕ Effacer** réinitialise la recherche.

#### Le tableau

Chaque ligne affiche : un **avatar** à initiales, le **nom**, l'**email** (cliquable, ouvre votre messagerie), la **société** (badge bleu) et l'**identifiant**.

> ⚠️ La liste des clients est gérée en mémoire et amorcée au démarrage (clients de démonstration). Elle n'est pas modifiable depuis l'application.

### 11.3 Réservations

Page **📋 Réservations** — suivi de toutes les réservations clients.

#### Statistiques

- **Total réservations** ;
- **Actives** ;
- **Chiffre d'affaires** : cumul des montants.

#### Filtrer

Des boutons permettent de filtrer par statut. Les statuts possibles :

| Statut | Libellé | Couleur |
|---|---|---|
| `active` | Actif | 🟢 Vert |
| `pending` | En attente | 🟠 Orange |
| `cancelled` | Annulé | 🔴 Rouge |
| `expired` | Expiré | ⚪ Gris |

#### Le tableau

Chaque réservation affiche : numéro, client (avec avatar), offre (badge), montant, dates de début et de fin, et statut.

---

## 12. Procédures pas à pas

Cette section récapitule les opérations les plus courantes sous forme de marches à suivre.

### 12.1 Se connecter pour la première fois

1. Vérifiez que WAMP est démarré (icône verte).
2. Ouvrez WorkTogether.
3. Saisissez `admin@local.test` / `admin123!`.
4. Cliquez sur **Se connecter**.
5. Créez aussitôt votre compte personnel (voir 12.2).

### 12.2 Créer un nouvel utilisateur

1. Menu **Administration → 👤 Utilisateurs**.
2. Dans « Nouveau compte », renseignez email, mot de passe (≥ 6 caractères) et rôle.
3. Cliquez sur **Créer le compte** (confirmez si rôle Administrateur).
4. Le compte apparaît dans la liste.

### 12.3 Ajouter une baie

1. Menu **Administration → 🖥️ Baies**.
2. Panneau « Ajouter une baie » : saisissez le nom et le nombre d'unités.
3. Cliquez sur **➕ Ajouter la baie**.

### 12.4 Clôturer un ticket

1. Menu **Support → 🎫 Tickets**.
2. Repérez le ticket (filtre **Ouverts**).
3. Cliquez sur **✓ Clôturer**.

### 12.5 Créer puis modifier une offre

1. Menu **Administration → 🛒 Gestion Offres**.
2. Remplissez « Nouvelle offre » et cliquez sur **Créer l'offre**.
3. Pour modifier : cliquez sur **✎ Éditer**, ajustez, puis **Enregistrer**.

### 12.6 Consulter le chiffre d'affaires

1. Menu **Comptabilité → 📊 Tableau de bord**.
2. Lisez la carte **Revenu mensuel actif** et la section **Top clients**.

### 12.7 Diagnostiquer un incident via les journaux

1. Menu **Administration → 📄 Journaux**.
2. Sélectionnez le fichier le plus récent.
3. Filtrez sur **ERROR** pour repérer les erreurs.
4. Utilisez la recherche pour cibler un mot-clé.

### 12.8 Changer le mot de passe administrateur par défaut

L'application ne propose pas de modification de mot de passe en place. Procédez ainsi :

1. Créez un nouveau compte administrateur avec un mot de passe fort.
2. Reconnectez-vous avec ce compte.
3. Supprimez l'ancien compte `admin@local.test`.

---

## 13. Questions fréquentes (FAQ)

**Q. Pourquoi dois-je me reconnecter à chaque ouverture de l'application ?**
R. C'est une mesure de sécurité : la session est effacée à la fermeture de l'application.

**Q. J'ai créé une offre, mais elle a disparu après le redémarrage. Est-ce normal ?**
R. Oui. Les offres, clients et réservations sont gérés en mémoire et réinitialisés à chaque lancement. Seules les baies, les tickets et les comptes utilisateurs sont conservés durablement.

**Q. Je ne vois pas le menu Comptabilité / Administration.**
R. Ces menus n'apparaissent que si votre compte possède le rôle correspondant. Contactez un administrateur si vous pensez que c'est une erreur.

**Q. Que signifie le pourcentage sur une baie ?**
R. C'est le taux d'occupation : la proportion d'unités utilisées par rapport à la capacité totale.

**Q. Pourquoi ne puis-je pas supprimer une offre ?**
R. Parce qu'elle est utilisée par au moins une réservation. Le bouton de suppression est alors désactivé.

**Q. Quel mot de passe choisir ?**
R. Au moins 6 caractères sont exigés. Pour la sécurité, privilégiez un mot de passe long et unique (12 caractères ou plus, mêlant lettres, chiffres et symboles).

**Q. J'ai oublié mon mot de passe.**
R. L'application ne permet pas de réinitialiser un mot de passe soi-même. Demandez à un administrateur de supprimer puis recréer votre compte.

**Q. Puis-je utiliser l'application sans WAMP ?**
R. Non. La base de données MySQL fournie par WAMP est indispensable.

**Q. Mes emails de clients sont-ils cliquables ?**
R. Oui, cliquer sur l'email d'un client dans la page Clients ouvre votre logiciel de messagerie.

---

## 14. Résolution de problèmes

| Problème | Que faire |
|---|---|
| **Un message indique que MySQL n'est pas accessible** | Vérifiez que WAMP est démarré (icône verte). L'application tente de démarrer la base automatiquement ; patientez jusqu'à 30 secondes. |
| **L'application se ferme après « Impossible de démarrer MySQL »** | Lancez l'application en **tant qu'administrateur** (clic droit → Exécuter en tant qu'administrateur). Vérifiez que WAMP est installé et que la base `worktogether` existe. |
| **« Acces refuse » sur une page** | Votre rôle ne permet pas d'accéder à cette page. C'est normal. |
| **Une page affiche une erreur de chargement** | Cliquez sur **↻ Actualiser**. Si l'erreur persiste, redémarrez l'application. |
| **« Cette fonctionnalité nécessite l'application Tauri »** | L'application a été ouverte dans un navigateur web au lieu de l'application de bureau. Utilisez bien l'application installée. |
| **Connexion refusée avec le bon mot de passe** | Vérifiez l'orthographe de votre email. Votre compte est peut-être désactivé : contactez un administrateur. |
| **Les statistiques affichent « — »** | Les données ne sont pas encore chargées ou la base est vide. Actualisez. |
| **Plus aucun administrateur ne peut se connecter** | Un technicien doit recréer un compte via l'outil `create-admin` (voir documentation technique). |

> 🆘 Si un problème persiste, transmettez à votre support technique le **fichier de log** le plus récent (menu Administration → Journaux, ou dossier `%APPDATA%\fr.worktogether.backoffice\logs\`).

---

## 15. Glossaire

| Terme | Définition |
|---|---|
| **Backoffice** | Interface d'administration interne, non destinée aux clients finaux. |
| **Baie** | Armoire du datacenter contenant des équipements, mesurée en unités. |
| **Unité (U)** | Emplacement standard dans une baie ; une baie en compte 42 par défaut. |
| **Taux d'occupation** | Proportion d'unités utilisées par rapport à la capacité totale. |
| **Ticket** | Demande d'assistance d'un client, avec une priorité et un statut. |
| **Offre** | Formule commerciale (nombre d'unités, prix mensuel, remise). |
| **Réservation** | Engagement d'un client sur une offre, avec un montant et une période. |
| **Rôle** | Ensemble de droits déterminant ce à quoi un utilisateur a accès. |
| **KPI** | *Key Performance Indicator* — indicateur clé affiché en carte. |
| **Journal (log)** | Fichier qui enregistre l'activité de l'application. |
| **WAMP** | Logiciel hébergeant la base de données MySQL sur le poste. |
| **Session** | Période pendant laquelle vous êtes connecté ; effacée à la fermeture. |

---

*Fin du guide utilisateur — WorkTogether 1.0.0.*
*Pour toute question technique (installation, base de données, déploiement), reportez-vous à la* Documentation Technique.
