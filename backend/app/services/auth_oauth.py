from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from httpx import AsyncClient
from app.config import settings
import secrets

class OAuthService:
    
    @staticmethod
    async def get_google_token(code: str):
        """
        Échange le code d'autorisation contre un token d'accès Google OAuth2
        """
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Google OAuth n'est pas configuré"
            )
            
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        }
        
        try:
            async with AsyncClient() as client:
                response = await client.post(token_url, data=payload)
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Échec d'obtention du token: {response.text}"
                    )
                
                return response.json()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Échec d'obtention du token: {str(e)}"
            )
    
    @staticmethod
    async def get_google_user_info(access_token: str):
        """
        Récupère les informations utilisateur depuis Google avec le token d'accès
        """
        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            async with AsyncClient() as client:
                response = await client.get(user_info_url, headers=headers)
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Échec d'obtention des infos utilisateur: {response.text}"
                    )
                
                return response.json()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Échec d'obtention des infos utilisateur: {str(e)}"
            )
    
    @staticmethod
    def find_or_create_oauth_user(db: Session, user_info: dict, provider: str = "google"):
        """
        Trouve un utilisateur existant par ID OAuth ou en crée un nouveau
        """
        from app.models.user import User
        from app.utils.security import hash_password
        
        provider_id = user_info.get("sub")
        email = user_info.get("email")
        
        if not provider_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Informations utilisateur incomplètes"
            )
        
        user = db.execute(
            select(User).where(
                User.oauth_provider == provider,
                User.oauth_provider_id == provider_id
            )
        ).scalar_one_or_none()
        
        if user:
            return user
        
        user = db.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()
        
        if user:
            user.oauth_provider = provider
            user.oauth_provider_id = provider_id
            db.commit()
            db.refresh(user)
            return user
        
        full_name = user_info.get("name", "")
        random_password = hash_password(secrets.token_urlsafe(16))
        
        new_user = User(
            email=email,
            hashed_password=random_password,  
            full_name=full_name,
            oauth_provider=provider,
            oauth_provider_id=provider_id,
            is_active=True,
            is_verified=True,  
            storage_quota=settings.STORAGE_QUOTA
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user