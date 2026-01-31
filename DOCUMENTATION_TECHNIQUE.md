# DOCUMENTATION TECHNIQUE - SUPFile

**Projet** : SUPFile - Plateforme de stockage cloud   
---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Justifications des choix technologiques](#2-justifications-des-choix-technologiques)
3. [Architecture système](#3-architecture-système)
4. [Schéma de base de données](#4-schéma-de-base-de-données)
5. [Architecture API](#5-architecture-api)
6. [Guide de déploiement](#6-guide-de-déploiement)
7. [Configuration](#7-configuration)
8. [Sécurité](#8-sécurité)

---

## 1. Vue d'ensemble

### 1.1 Description du projet

SUPFile est une application web de stockage cloud permettant aux utilisateurs de :
- Stocker des fichiers et dossiers de manière sécurisée
- Gérer une arborescence complète de fichiers
- Partager des fichiers via liens publics
- Gérer un quota de stockage (30 Go par utilisateur)
- S'authentifier via email/mot de passe ou OAuth2 (Google)

### 1.2 Architecture globale

Le projet suit une **architecture 3-tiers** stricte :

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│              Interface utilisateur (Port 3000)               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST (JSON)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Python)                 │
│              API REST + Logique métier (Port 8000)           │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL (PostgreSQL)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  BASE DE DONNÉES (PostgreSQL)                │
│              Stockage métadonnées (Port 5432)                │
└─────────────────────────────────────────────────────────────┘
```

**Séparation des responsabilités :**
- **Frontend** : Interface utilisateur uniquement (aucune logique métier)
- **Backend** : Logique métier, validation, authentification, gestion fichiers
- **Base de données** : Persistance des métadonnées (pas des fichiers physiques)

---

## 2. Justifications des choix technologiques

### 2.1 Backend : FastAPI (Python 3.11)

**Raisons du choix :**

1. **Performance** : FastAPI est l'un des frameworks Python les plus rapides grâce à :
   - Support asynchrone natif (async/await)
   - Validation automatique via Pydantic
   - Sérialisation JSON optimisée

2. **Documentation automatique** : 
   - Génération automatique d'une interface Swagger UI (`/docs`)
   - Facilite les tests et la compréhension de l'API

3. **Typage moderne** :
   - Python 3.11 avec type hints
   - Détection d'erreurs en amont
   - Meilleure maintenabilité

4. **Écosystème mature** :
   - SQLAlchemy pour l'ORM (indépendance BDD)
   - Pydantic pour la validation de données
   - Support natif OAuth2

**Alternatives considérées :**
- Django REST Framework : trop lourd pour ce projet
- Flask : moins de fonctionnalités natives (pas de validation auto)

---

### 2.2 Frontend : React 18 + Vite

**Raisons du choix :**

1. **React 18** :
   - Composants réutilisables (DRY principle)
   - Virtual DOM pour performances optimales
   - Écosystème riche (React Router, React Bootstrap)

2. **Vite** :
   - Build ultra-rapide (HMR instantané)
   - Bundle optimisé pour production
   - Configuration minimale

3. **React Bootstrap** :
   - Composants UI professionnels prêts à l'emploi
   - Responsive design natif
   - Cohérence visuelle

**Alternatives considérées :**
- Vue.js : moins répandu en entreprise
- Angular : courbe d'apprentissage trop raide

---

### 2.3 Base de données : PostgreSQL 15

**Raisons du choix :**

1. **Robustesse** :
   - ACID compliant (transactions fiables)
   - Support des contraintes de clés étrangères
   - Gestion avancée des index

2. **Performance** :
   - Optimisé pour les lectures/écritures concurrentes
   - Support des index B-tree pour les recherches

3. **Fonctionnalités avancées** :
   - Support JSON natif (pour évolutions futures)
   - Full-text search (recherche de fichiers)
   - Triggers et procédures stockées

**Alternatives considérées :**
- MySQL : moins de fonctionnalités avancées
- MongoDB : non relationnel, inadapté pour relations complexes (fichiers/dossiers/utilisateurs)

---

### 2.4 Conteneurisation : Docker + Docker Compose

**Raisons du choix :**

1. **Portabilité** :
   - Fonctionne identiquement sur Windows/Mac/Linux
   - Élimine le "ça marche sur ma machine"

2. **Isolation** :
   - Chaque service dans son conteneur
   - Pas de conflits de dépendances

3. **Reproductibilité** :
   - Déploiement en une commande : `docker compose up`
   - Environnement identique dev/prod

4. **Simplicité** :
   - Docker Compose orchestre les 3 services
   - Gestion automatique du réseau et des volumes

---

## 3. Architecture système

### 3.1 Structure du projet

```
supfile/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── main.py            # Point d'entrée FastAPI
│   │   ├── config.py          # Configuration (variables d'environnement)
│   │   ├── database.py        # Connexion PostgreSQL + ORM
│   │   ├── models/            # Modèles SQLAlchemy
│   │   │   ├── user.py        # Modèle User
│   │   │   ├── file.py        # Modèle File
│   │   │   ├── folder.py      # Modèle Folder
│   │   │   └── share.py       # Modèle Share
│   │   ├── routers/           # Routes API (endpoints)
│   │   │   ├── auth.py        # Authentification
│   │   │   ├── users.py       # Gestion utilisateurs
│   │   │   ├── files.py       # Gestion fichiers
│   │   │   ├── folders.py     # Gestion dossiers
│   │   │   └── shares.py      # Partage de fichiers
│   │   ├── services/          # Logique métier
│   │   │   ├── auth_service.py      # Service authentification
│   │   │   ├── auth_oauth.py        # Service OAuth2
│   │   │   ├── file_service.py      # Service fichiers
│   │   │   ├── folder_service.py    # Service dossiers
│   │   │   ├── share_service.py     # Service partage
│   │   │   └── user_service.py      # Service utilisateurs
│   │   ├── schemas/           # Schémas Pydantic (validation)
│   │   └── utils/             # Utilitaires (sécurité, dépendances)
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                   # Application React
│   ├── src/
│   │   ├── main.jsx           # Point d'entrée React
│   │   ├── App.jsx            # Composant racine + routing
│   │   ├── components/        # Composants React
│   │   │   ├── Auth/          # Composants authentification
│   │   │   ├── Files/         # Composants gestion fichiers
│   │   │   ├── Layout/        # Composants layout (navbar, etc.)
│   │   │   └── Shared/        # Composants réutilisables
│   │   ├── contexts/          # Contextes React (état global)
│   │   │   ├── AuthContext.jsx    # Contexte authentification
│   │   │   └── FileContext.jsx    # Contexte fichiers/dossiers
│   │   ├── pages/             # Pages de l'application
│   │   ├── services/          # Services API (axios)
│   │   └── utils/             # Utilitaires (formatage, validation)
│   ├── Dockerfile
│   ├── nginx.conf             # Configuration Nginx
│   └── package.json
│
├── uploads/                    # Stockage physique des fichiers (volume Docker)
├── docker-compose.yml          # Orchestration des services
├── .env.example               # Template configuration
└── README.md
```

---

### 3.2 Flux de données

#### Exemple : Upload d'un fichier

```
1. User (navigateur)
   │
   ├─► POST /api/v1/files/upload (FormData)
   │
2. Frontend (React)
   │
   ├─► Axios + FormData
   │
3. Backend (FastAPI)
   │
   ├─► Authentification JWT (middleware)
   ├─► Validation quota utilisateur
   ├─► Sauvegarde physique (/app/uploads/{uuid})
   ├─► Création enregistrement BDD (métadonnées)
   └─► Mise à jour storage_used
   │
4. Base de données (PostgreSQL)
   │
   └─► INSERT INTO files (...)
   └─► UPDATE users SET storage_used = ...
```

---

## 4. Schéma de base de données

### 4.1 Diagramme entité-relation

```
┌─────────────────────────────────────────────┐
│                   USERS                     │
├─────────────────────────────────────────────┤
│ PK│ id                 INTEGER              │
│   │ email              VARCHAR   UNIQUE     │
│   │ hashed_password    VARCHAR   NULLABLE   │
│   │ full_name          VARCHAR   NULLABLE   │
│   │ is_active          BOOLEAN   DEFAULT T  │
│   │ is_verified        BOOLEAN   DEFAULT F  │
│   │ storage_used       BIGINT    DEFAULT 0  │
│   │ storage_quota      BIGINT                │
│   │ oauth_provider     VARCHAR   NULLABLE   │
│   │ oauth_provider_id  VARCHAR   NULLABLE   │
│   │ created_at         TIMESTAMP             │
│   │ updated_at         TIMESTAMP NULLABLE   │
└─────────────────────────────────────────────┘
            │
            │ 1
            │
            │ N
            ▼
┌─────────────────────────────────────────────┐
│                  FOLDERS                    │
├─────────────────────────────────────────────┤
│ PK│ id                 INTEGER              │
│   │ name               VARCHAR              │
│ FK│ parent_id          INTEGER   NULLABLE   │◄──┐
│ FK│ user_id            INTEGER              │   │
│   │ is_deleted         BOOLEAN   DEFAULT F  │   │
│   │ deleted_at         TIMESTAMP NULLABLE   │   │
│   │ created_at         TIMESTAMP             │   │
│   │ updated_at         TIMESTAMP NULLABLE   │   │
└─────────────────────────────────────────────┘   │
            │                                      │
            └──────────────────────────────────────┘
            │ 1                          (auto-référence)
            │
            │ N
            ▼
┌─────────────────────────────────────────────┐
│                   FILES                     │
├─────────────────────────────────────────────┤
│ PK│ id                 INTEGER              │
│   │ name               VARCHAR              │
│   │ original_name      VARCHAR              │
│   │ size               BIGINT               │
│   │ mime_type          VARCHAR   NULLABLE   │
│   │ storage_path       VARCHAR   UNIQUE     │
│ FK│ user_id            INTEGER              │
│ FK│ folder_id          INTEGER   NULLABLE   │
│   │ is_deleted         BOOLEAN   DEFAULT F  │
│   │ deleted_at         TIMESTAMP NULLABLE   │
│   │ created_at         TIMESTAMP             │
│   │ updated_at         TIMESTAMP NULLABLE   │
└─────────────────────────────────────────────┘
            │ 1
            │
            │ N
            ▼
┌─────────────────────────────────────────────┐
│                  SHARES                     │
├─────────────────────────────────────────────┤
│ PK│ id                 INTEGER              │
│   │ token              VARCHAR   UNIQUE     │
│ FK│ file_id            INTEGER              │
│   │ is_active          BOOLEAN   DEFAULT T  │
│   │ expires_at         TIMESTAMP NULLABLE   │
│   │ created_at         TIMESTAMP             │
└─────────────────────────────────────────────┘
```

---

### 4.2 Description des tables

#### **Table USERS**
Stocke les informations des utilisateurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INTEGER | Clé primaire auto-incrémentée |
| `email` | VARCHAR | Email unique (login) |
| `hashed_password` | VARCHAR | Mot de passe hashé (bcrypt), NULL pour OAuth |
| `full_name` | VARCHAR | Nom complet (optionnel) |
| `storage_used` | BIGINT | Espace utilisé en octets |
| `storage_quota` | BIGINT | Quota total (défaut : 30 Go) |
| `oauth_provider` | VARCHAR | Fournisseur OAuth (google, microsoft, etc.) |
| `oauth_provider_id` | VARCHAR | ID utilisateur chez le fournisseur OAuth |
| `is_active` | BOOLEAN | Compte actif/désactivé |
| `is_verified` | BOOLEAN | Email vérifié |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de dernière modification |

**Contraintes :**
- UNIQUE sur `email`
- CHECK : `storage_used <= storage_quota`

---

#### **Table FOLDERS**
Stocke l'arborescence des dossiers.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INTEGER | Clé primaire |
| `name` | VARCHAR | Nom du dossier |
| `parent_id` | INTEGER | FK vers FOLDERS (auto-référence), NULL = racine |
| `user_id` | INTEGER | FK vers USERS (propriétaire) |
| `is_deleted` | BOOLEAN | Soft delete (corbeille) |
| `deleted_at` | TIMESTAMP | Date de suppression |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de modification |

**Contraintes :**
- FK `parent_id` → `folders(id)` ON DELETE CASCADE
- FK `user_id` → `users(id)` ON DELETE CASCADE

---

#### **Table FILES**
Stocke les métadonnées des fichiers (pas le contenu).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INTEGER | Clé primaire |
| `name` | VARCHAR | Nom modifiable du fichier |
| `original_name` | VARCHAR | Nom original lors de l'upload |
| `size` | BIGINT | Taille en octets |
| `mime_type` | VARCHAR | Type MIME (image/png, etc.) |
| `storage_path` | VARCHAR | Chemin physique (UUID) |
| `user_id` | INTEGER | FK vers USERS (propriétaire) |
| `folder_id` | INTEGER | FK vers FOLDERS, NULL = racine |
| `is_deleted` | BOOLEAN | Soft delete (corbeille) |
| `deleted_at` | TIMESTAMP | Date de suppression |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de modification |

**Contraintes :**
- UNIQUE sur `storage_path`
- FK `user_id` → `users(id)` ON DELETE CASCADE
- FK `folder_id` → `folders(id)` ON DELETE SET NULL

---

#### **Table SHARES**
Stocke les liens de partage publics.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INTEGER | Clé primaire |
| `token` | VARCHAR | Token unique (URL-safe, 32 caractères) |
| `file_id` | INTEGER | FK vers FILES |
| `is_active` | BOOLEAN | Lien actif/désactivé |
| `expires_at` | TIMESTAMP | Date d'expiration (NULL = permanent) |
| `created_at` | TIMESTAMP | Date de création |

**Contraintes :**
- UNIQUE sur `token`
- FK `file_id` → `files(id)` ON DELETE CASCADE
- INDEX sur `token` (recherche rapide)

---

### 4.3 Stratégies de suppression

**Soft Delete (corbeille) :**
- Fichiers et dossiers marqués `is_deleted=True`
- Restauration possible via endpoint `/restore`
- Suppression définitive : suppression physique + mise à jour quota

**Hard Delete (définitif) :**
- Suppression enregistrement BDD
- Suppression fichier physique (`os.remove()`)
- Libération quota utilisateur (`storage_used -= file.size`)

---

## 5. Architecture API

### 5.1 Endpoints principaux

**Base URL** : `http://localhost:8000/api/v1`

#### **Authentification (`/auth`)**

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/auth/register` | Inscription | Non |
| POST | `/auth/login` | Connexion | Non |
| GET | `/auth/me` | Profil utilisateur | Oui |
| GET | `/auth/google` | Redirection OAuth2 Google | Non |
| GET | `/auth/google/callback` | Callback OAuth2 | Non |

---

#### **Utilisateurs (`/users`)**

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/users/me` | Récupérer profil | Oui |
| PUT | `/users/me` | Modifier profil | Oui |
| PUT | `/users/me/password` | Changer mot de passe | Oui |
| GET | `/users/me/oauth` | Liste connexions OAuth | Oui |
| POST | `/users/me/oauth/disconnect` | Déconnecter OAuth | Oui |

---

#### **Fichiers (`/files`)**

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/files/upload` | Upload fichier | Oui |
| GET | `/files/` | Liste fichiers | Oui |
| GET | `/files/{id}` | Détails fichier | Oui |
| PUT | `/files/{id}` | Renommer/déplacer | Oui |
| DELETE | `/files/{id}` | Supprimer (corbeille) | Oui |
| POST | `/files/{id}/restore` | Restaurer | Oui |
| GET | `/files/{id}/download` | Télécharger | Oui |
| GET | `/files/{id}/preview` | Prévisualiser | Oui |
| GET | `/files/search` | Recherche | Oui |

**Paramètres query** :
- `folder_id` : Filtrer par dossier
- `show_deleted` : Afficher corbeille
- `permanent` : Suppression définitive

---

#### **Dossiers (`/folders`)**

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/folders/` | Créer dossier | Oui |
| GET | `/folders/` | Liste dossiers | Oui |
| GET | `/folders/{id}` | Détails dossier | Oui |
| PUT | `/folders/{id}` | Renommer/déplacer | Oui |
| DELETE | `/folders/{id}` | Supprimer | Oui |
| POST | `/folders/{id}/restore` | Restaurer | Oui |
| GET | `/folders/{id}/download` | Télécharger ZIP | Oui |

**Paramètres query** :
- `parent_id` : Filtrer par parent
- `recursive` : Suppression récursive
- `permanent` : Suppression définitive

---

#### **Partage (`/shares`)**

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/shares/{file_id}` | Créer lien | Oui |
| GET | `/shares/` | Liste mes liens | Oui |
| DELETE | `/shares/{id}` | Supprimer lien | Oui |
| GET | `/shares/public/{token}` | Accès public | Non |
| GET | `/shares/public/{token}/download` | Télécharger public | Non |

---

### 5.2 Authentification JWT

**Flux d'authentification :**

```
1. POST /auth/login
   Body: { email, password }
   ↓
2. Backend vérifie credentials
   ↓
3. Génération JWT token (expire: 30min)
   Claims: { sub: user_id, email: user_email, exp: timestamp }
   ↓
4. Retour: { access_token, token_type: "bearer", user: {...} }
   ↓
5. Frontend stocke token (localStorage)
   ↓
6. Requêtes suivantes:
   Header: Authorization: Bearer <token>
```

**Sécurité :**
- Algorithme : HS256 (HMAC-SHA256)
- Secret key : 256 bits minimum (variable d'environnement)
- Expiration : 30 minutes (configurable)
- Refresh : ré-authentification requise après expiration

---

### 5.3 Gestion des erreurs

**Codes HTTP utilisés :**

| Code | Description | Exemple |
|------|-------------|---------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée |
| 400 | Bad Request | Validation échouée |
| 401 | Unauthorized | Token manquant/invalide |
| 403 | Forbidden | Accès refusé |
| 404 | Not Found | Ressource inexistante |
| 413 | Payload Too Large | Fichier trop volumineux |
| 500 | Internal Server Error | Erreur serveur |

**Format des erreurs :**

```json
{
  "detail": "Message d'erreur explicite"
}
```

---

## 6. Guide de déploiement

### 6.1 Prérequis

- **Docker** : Version 24.0+
- **Docker Compose** : Version 2.20+
- **Git** : Pour cloner le projet
- **Ports libres** : 3000 (frontend), 8000 (backend), 5432 (postgres)

---

### 6.2 Installation

#### **Étape 1 : Cloner le projet**

```bash
git clone https://github.com/Anaqqa/supfile.git
cd supfile
```

---

#### **Étape 2 : Configuration**

```bash
# Copier le template de configuration
cp .env.example .env

# Éditer le fichier .env
nano .env  # ou notepad .env sur Windows
```

**Variables obligatoires à modifier :**

```env
# Sécurité (CRITIQUE - À CHANGER EN PRODUCTION)
SECRET_KEY=<générer_une_clé_forte_32_caractères>
POSTGRES_PASSWORD=<mot_de_passe_fort>

# OAuth Google (optionnel mais recommandé)
GOOGLE_CLIENT_ID=<votre_client_id>
GOOGLE_CLIENT_SECRET=<votre_client_secret>
```

**Générer une clé secrète :**

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

#### **Étape 3 : Lancement**

```bash
# Construire et démarrer tous les services
docker compose up --build

# En mode détaché (background)
docker compose up -d --build
```

**Temps de démarrage** : 2-3 minutes (première fois)

---

#### **Étape 4 : Vérification**

```bash
# Vérifier l'état des conteneurs
docker compose ps

# Résultat attendu :
# NAME                  STATUS
# supfile_postgres      Up (healthy)
# supfile_backend       Up
# supfile_frontend      Up
```

---

#### **Étape 5 : Accès**

| Service | URL | Description |
|---------|-----|-------------|
| **Application web** | http://localhost:3000 | Interface utilisateur |
| **API Documentation** | http://localhost:8000/docs | Swagger UI interactive |
| **Health check** | http://localhost:8000/health | Status de l'API |

---

### 6.3 Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f

# Logs d'un service spécifique
docker compose logs -f backend

# Arrêter les services
docker compose down

# Arrêter et supprimer les volumes (ATTENTION : perte de données)
docker compose down -v

# Rebuild un service spécifique
docker compose build backend
docker compose up -d backend

# Exécuter une commande dans un conteneur
docker compose exec backend bash
docker compose exec postgres psql -U supfile_user -d supfile_db
```

---

### 6.4 Déploiement en production

**Modifications recommandées pour la production :**

1. **Supprimer `--reload` dans docker-compose.yml :**

```yaml
# Mode production
command: uvicorn app.main:app --host 0.0.0.0 --port 8000
```

2. **Utiliser un reverse proxy (Nginx/Traefik) :**

```nginx
server {
    listen 80;
    server_name votredomaine.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

3. **Activer HTTPS (Let's Encrypt) :**

```bash
certbot --nginx -d votredomaine.com
```

4. **Variables d'environnement sécurisées :**

```env
ENVIRONMENT=production
SECRET_KEY=<clé_générée_cryptographiquement>
POSTGRES_PASSWORD=<mot_de_passe_très_fort>
```

5. **Sauvegardes automatiques :**

```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U supfile_user supfile_db > backup.sql

# Backup fichiers
tar -czf uploads_backup.tar.gz uploads/
```

---

## 7. Configuration

### 7.1 Variables d'environnement

**Toutes les variables sont documentées dans `.env.example`.**

**Variables critiques :**

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `SECRET_KEY` | Clé signature JWT | **À GÉNÉRER** |
| `POSTGRES_PASSWORD` | Mot de passe BDD | **À CHANGER** |
| `STORAGE_QUOTA` | Quota par user (octets) | 32212254720 (30 Go) |
| `MAX_FILE_SIZE` | Taille max fichier | 5368709120 (5 Go) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée token JWT | 30 |

---

### 7.2 Limites système

| Limite | Valeur | Configurable via |
|--------|--------|------------------|
| Quota utilisateur | 30 Go | `STORAGE_QUOTA` |
| Taille max fichier | 5 Go | `MAX_FILE_SIZE` |
| Durée session | 30 min | `ACCESS_TOKEN_EXPIRE_MINUTES` |
| Connexions PostgreSQL | 100 | `postgresql.conf` |

---

## 8. Sécurité

### 8.1 Mesures implémentées

#### **Authentification**

1. **Hashage des mots de passe** :
   - Algorithme : bcrypt (coût : 12 rounds)
   - Jamais de stockage en clair

2. **JWT sécurisés** :
   - Signature HMAC-SHA256
   - Expiration automatique (30 min)
   - Secret key de 256 bits minimum

3. **OAuth2** :
   - Google OAuth2 implémenté
   - Pas de stockage des tokens OAuth (utilisation directe)

---

#### **Validation des entrées**

1. **Pydantic** :
   - Validation automatique de tous les endpoints
   - Typage strict

2. **Validation fichiers** :
   - Vérification extension et MIME type (via python-magic)
   - Blocage fichiers exécutables

3. **Validation noms** :
   - Interdiction caractères spéciaux dangereux
   - Limitation longueur (255 caractères)

---

#### **Gestion des fichiers**

1. **UUID pour stockage** :
   - Noms physiques = UUID (pas de collision)
   - Impossible de deviner un chemin fichier

2. **Séparation métadonnées/contenu** :
   - BDD = métadonnées uniquement
   - Fichiers physiques dans `/app/uploads`

3. **Quota strict** :
   - Vérification avant chaque upload
   - Mise à jour atomique du quota

---

#### **Protection réseau**

1. **CORS configuré** :
   - Liste blanche des origines autorisées
   - Credentials activés uniquement pour origines connues

2. **Rate limiting** (recommandé en production) :
   - Limiter tentatives de connexion
   - Limiter uploads par IP

---

## Annexe A : Troubleshooting

### Problème : Erreur "Table 'users' is already defined"

**Cause** : Imports circulaires dans `backend/app/models/__init__.py`

**Solution** :
```bash
echo '"""Module initialization file"""' > backend/app/models/__init__.py
docker compose restart backend
```

---

### Problème : "Port 3000 already in use"

**Solution Windows** :
```bash
netstat -ano | findstr :3000
taskkill /PID <numéro_pid> /F
```

**Solution Linux/Mac** :
```bash
lsof -ti:3000 | xargs kill -9
```

---

### Problème : Upload échoue avec "Quota exceeded"

**Vérifier le quota utilisateur** :
```bash
docker compose exec postgres psql -U supfile_user -d supfile_db -c "SELECT email, storage_used, storage_quota FROM users;"
```

**Réinitialiser le quota (DEV uniquement)** :
```bash
docker compose exec postgres psql -U supfile_user -d supfile_db -c "UPDATE users SET storage_used = 0;"
```

---

## Annexe B : Références

### Documentation officielle

- **FastAPI** : https://fastapi.tiangolo.com
- **React** : https://react.dev
- **PostgreSQL** : https://www.postgresql.org/docs
- **Docker** : https://docs.docker.com
- **SQLAlchemy** : https://docs.sqlalchemy.org

### Outils de développement

- **Swagger UI** : http://localhost:8000/docs (API interactive)
- **pgAdmin** : Outil graphique PostgreSQL
- **Postman** : Tests API

---

**Fin de la documentation technique**