from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_active_user
from app.models.user import User


router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau compte utilisateur
    
    - **email**: Email valide (unique)
    - **password**: Mot de passe (minimum 8 caractères)
    - **full_name**: Nom complet (optionnel)
    """
    user = AuthService.register_user(db, user_data)
    return user

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Se connecter et obtenir un token JWT
    
    - **email**: Email du compte
    - **password**: Mot de passe
    
    Retourne un token d'accès valide 30 minutes
    """
    result = AuthService.authenticate_user(db, login_data)
    return result

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les informations de l'utilisateur connecté
    
    Nécessite un token JWT valide dans le header Authorization
    """
    return current_user

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    Se déconnecter (côté client, supprimer le token)
    
    Note: Avec JWT, la déconnexion est gérée côté client
    """
    return {"message": "Successfully logged out"}