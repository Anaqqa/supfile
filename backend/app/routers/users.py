from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.oauth import OAuthProviderInfo, OAuthDisconnectRequest
from app.models.user import User
from app.utils.dependencies import get_current_active_user
from app.services.user_service import UserService


router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les informations de l'utilisateur connecté
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mettre à jour les informations de l'utilisateur
    
    - **full_name**: Nouveau nom complet (optionnel)
    """
    return UserService.update_user(db, current_user.id, user_data)

@router.put("/me/password")
async def change_password(
    password_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Changer le mot de passe
    
    - **current_password**: Mot de passe actuel
    - **new_password**: Nouveau mot de passe
    """
    if not password_data.get("current_password") or not password_data.get("new_password"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les mots de passe actuels et nouveaux sont requis"
        )
        
    UserService.change_password(
        db, 
        current_user, 
        password_data["current_password"], 
        password_data["new_password"]
    )
    
    return {"message": "Mot de passe changé avec succès"}

@router.get("/me/oauth", response_model=List[OAuthProviderInfo])
async def get_oauth_connections(
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les connexions OAuth de l'utilisateur
    """
    if current_user.oauth_provider and current_user.oauth_provider_id:
        return [
            OAuthProviderInfo(
                provider=current_user.oauth_provider,
                provider_id=current_user.oauth_provider_id,
                provider_user_info={}
            )
        ]
    return []

@router.post("/me/oauth/disconnect")
async def disconnect_oauth_provider(
    disconnect_data: OAuthDisconnectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Déconnecter un fournisseur OAuth
    
    - **provider**: Nom du fournisseur (ex: google)
    """
    if current_user.oauth_provider != disconnect_data.provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pas de connexion active au fournisseur: {disconnect_data.provider}"
        )
        
    return UserService.disconnect_oauth(db, current_user, disconnect_data.provider)