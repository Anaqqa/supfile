from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, users, files, folders, shares
from app.database import init_db

# Configuration FastAPI avec documentation OpenAPI automatique
app = FastAPI(
    title="SUPFile",
    description="API Backend pour SUPFile - Cloud Storage",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS activé pour permettre les appels depuis le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"], 
)

# Initialisation des tables en base au démarrage
@app.on_event("startup")
async def startup_event():
    init_db()

# Enregistrement des routes API avec préfixe de versioning
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(files.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(folders.router, prefix="/api/v1/folders", tags=["Folders"])
app.include_router(shares.router, prefix="/api/v1/shares", tags=["Shares"])

# Endpoint racine pour vérifier que l'API est accessible
@app.get("/")
async def root():
    return {
        "message": "SUPFile API",
        "status": "operational",
        "version": "1.0.0"
    }

# Health check pour monitoring de l'infrastructure
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }