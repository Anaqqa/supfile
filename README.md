# SUPFile - Cloud Storage Platform

Application web de stockage de fichiers cloud avec gestion avancée, partage sécurisé et interface moderne.

## Description

SUPFile est une plateforme de stockage cloud complète permettant aux utilisateurs de stocker, organiser et partager leurs fichiers en toute sécurité. L'application offre une interface web moderne et intuitive avec support du glisser-déposer, prévisualisation des fichiers, et gestion avancée des permissions.

## Fonctionnalités principales

- Authentification sécurisée (standard et OAuth2 Google)
- Gestion complète des fichiers et dossiers
- Prévisualisation intégrée (images, vidéos, PDF, texte)
- Glisser-déposer pour déplacer les fichiers
- Partage par liens publics sécurisés
- Recherche de fichiers par nom
- Corbeille avec restauration
- Téléchargement de dossiers en ZIP
- Quota de stockage (30 Go par utilisateur)
- Interface responsive et moderne

## Stack technique

### Frontend
- React 18 avec Vite
- Bootstrap 5 et React Bootstrap
- React Router pour le routage
- Axios pour les requêtes HTTP

### Backend
- FastAPI (Python 3.11)
- SQLAlchemy pour l'ORM
- Pydantic pour la validation
- JWT et OAuth2 (Google)
- Bcrypt pour le hachage des mots de passe

### Base de données
- PostgreSQL 15

### Infrastructure
- Docker et Docker Compose
- Nginx comme serveur web

## Prérequis

- Docker version 20.10 ou supérieure
- Docker Compose version 2.0 ou supérieure
- Git

## Installation et déploiement

### 1. Cloner le projet

```bash
git clone <repository-url>
cd supfile
```

### 2. Configuration

Créer un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos propres valeurs :

```env
# Base de données
POSTGRES_USER=supfile_user
POSTGRES_PASSWORD=CHANGEZ_MOI
POSTGRES_DB=supfile_db

# Sécurité JWT
SECRET_KEY=GENEREZ_UNE_CLE_SECRETE_ICI
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OAuth2 Google (optionnel)
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Stockage
MAX_FILE_SIZE=5368709120
STORAGE_QUOTA=32212254720
```

**Important** : Pour générer une clé secrète sécurisée :

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Lancement de l'application

```bash
docker compose up --build
```

L'application sera accessible aux adresses suivantes :

- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Documentation API : http://localhost:8000/docs
- PostgreSQL : localhost:5432

### 4. Arrêt de l'application

```bash
docker compose down
```

Pour supprimer également les volumes (données) :

```bash
docker compose down -v
```

## Structure du projet

```
supfile/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── models/            # Modèles SQLAlchemy
│   │   ├── routers/           # Routes API
│   │   ├── schemas/           # Schémas Pydantic
│   │   ├── services/          # Logique métier
│   │   ├── utils/             # Utilitaires
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Connexion BDD
│   │   └── main.py            # Point d'entrée
│   ├── requirements.txt       # Dépendances Python
│   └── Dockerfile             # Image Docker backend
├── frontend/                   # Application React
│   ├── src/
│   │   ├── components/        # Composants React
│   │   ├── contexts/          # Contextes (Auth, Files)
│   │   ├── pages/             # Pages principales
│   │   ├── services/          # Services API
│   │   ├── styles/            # Styles CSS
│   │   ├── utils/             # Utilitaires
│   │   ├── App.jsx            # Composant racine
│   │   └── main.jsx           # Point d'entrée
│   ├── package.json           # Dépendances Node.js
│   ├── Dockerfile             # Image Docker frontend
│   └── nginx.conf             # Configuration Nginx
├── uploads/                    # Stockage des fichiers
├── docker-compose.yml          # Orchestration Docker
├── .env.example               # Exemple de configuration
├── .gitignore                 # Fichiers ignorés par Git
├── README.md                  # Ce fichier
├── DOCUMENTATION_TECHNIQUE.md # Documentation technique
└── MANUEL_UTILISATEUR.md      # Manuel utilisateur

```

## Documentation

- **Documentation technique** : Voir `DOCUMENTATION_TECHNIQUE.md` pour l'architecture détaillée, les choix techniques et le schéma de base de données
- **Manuel utilisateur** : Voir `MANUEL_UTILISATEUR.md` pour les instructions d'utilisation de l'application

## Développement

### Backend (développement local)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (développement local)

```bash
cd frontend
npm install
npm run dev
```

## API REST

L'API REST est documentée automatiquement via Swagger UI :

- Swagger UI : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc
- OpenAPI JSON : http://localhost:8000/openapi.json

## Sécurité

- Mots de passe hachés avec bcrypt
- Authentification JWT avec tokens signés
- Protection CORS configurée
- Validation des données avec Pydantic
- ORM SQLAlchemy pour éviter les injections SQL
- Secrets stockés dans variables d'environnement

## Limites et quotas

- Taille maximale par fichier : 5 Go
- Quota de stockage par utilisateur : 30 Go
- Types de fichiers : Tous formats acceptés
- Prévisualisation disponible : Images, vidéos, PDF, texte

