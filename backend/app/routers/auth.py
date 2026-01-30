import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth_service import AuthService
from app.services.auth_oauth import OAuthService
from app.utils.dependencies import get_current_active_user
from app.models.user import User
from app.config import settings
from app.utils.security import create_access_token

router = APIRouter()

@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau compte utilisateur et retourner un token d'accès
    
    - **email**: Email valide (unique)
    - **password**: Mot de passe (minimum 8 caractères)
    - **full_name**: Nom complet (optionnel)
    """
    user = AuthService.register_user(db, user_data)
    
    # Créer un token d'accès pour l'utilisateur nouvellement inscrit
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "storage_used": user.storage_used,
            "storage_quota": user.storage_quota
        }
    }

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

@router.get("/google")
async def google_login():
    """
    Redirection vers la page de connexion Google
    
    Cette route redirige l'utilisateur vers la page de connexion Google
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED, 
            detail="Google OAuth n'est pas configuré"
        )
    
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    scope = "openid email profile"
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    
    return RedirectResponse(url=auth_url)

@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Callback de l'authentification Google
    
    Cette route est appelée par Google après que l'utilisateur se soit connecté
    """
    code = request.query_params.get("code")
    frontend_url = "http://localhost:3000/auth/callback"  
    
    if not code:
        return RedirectResponse(
            url=f"{frontend_url}?error=no_code"
        )
    
    try:
        token_response = await OAuthService.get_google_token(code)
        access_token = token_response.get("access_token")
        
        if not access_token:
            return RedirectResponse(
                url=f"{frontend_url}?error=no_token"
            )
        
        user_info = await OAuthService.get_google_user_info(access_token)
        
        user = OAuthService.find_or_create_oauth_user(db, user_info, "google")
        
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        

        return RedirectResponse(
            url=f"{frontend_url}?token={access_token}"
        )
    
    except Exception as e:
        print(f"Google callback error: {str(e)}")
        error_message = urllib.parse.quote(str(e))
        return RedirectResponse(
            url=f"{frontend_url}?error={error_message}"
        )