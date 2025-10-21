# SUPFile - Cloud Storage Platform
Application web de stockage de fichiers

## Stack Technique

**Frontend**
- React 18 avec Vite
- Bootstrap 5 & React Bootstrap
- React Router pour le routage
- Axios pour les requêtes HTTP

**Backend**
- FastAPI (Python 3.11)
- SQLAlchemy pour l'ORM
- Pydantic pour la validation
- JWT & OAuth2 (Google)

**Base de données**
- PostgreSQL 15

**Infrastructure**
- Docker & Docker Compose
- Nginx comme serveur web

## Installation

### Prérequis
- Docker et Docker Compose installés
- Git

### Configuration

```bash
git clone <repository-url>
cd supfile
cp .env.example .env
```

Modifiez le fichier `.env` :
- Générez une `SECRET_KEY` : `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- Changez `POSTGRES_PASSWORD`
- Ajoutez vos credentials Google OAuth2 (optionnel)

### Lancement

```bash
docker compose up --build
```

### Accès

- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Documentation API : http://localhost:8000/docs
- PostgreSQL : localhost:5432

## Structure du projet

```
supfile/
├── backend/          # API FastAPI
├── frontend/         # Application React
├── uploads/          # Stockage fichiers
└── docker-compose.yml
```

## Fonctionnalités

- Authentification (standard + OAuth2 Google)
- Gestion des fichiers (upload, download, rename, delete)
- Gestion des dossiers
- Prévisualisation de fichiers
- Partage par lien public
- Recherche
- Quota de stockage (30 GB par utilisateur)
- Corbeille

## Développement

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```# supfile
