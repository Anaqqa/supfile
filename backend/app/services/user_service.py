from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas.user import UserUpdate
from app.models.user import User
from app.utils.security import hash_password, verify_password

class UserService:
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        """Obtenir un utilisateur par ID"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        return user
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate):
        """Mettre à jour les informations utilisateur"""
        user = UserService.get_user_by_id(db, user_id)
        
        if user_data.full_name is not None:
            user.full_name = user_data.full_name
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def change_password(db: Session, user: User, current_password: str, new_password: str):
        """Changer le mot de passe utilisateur"""
        if not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de changer le mot de passe pour un compte OAuth uniquement"
            )
            
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Mot de passe actuel incorrect"
            )
            
        user.hashed_password = hash_password(new_password)
        db.commit()
        return True
    
    @staticmethod
    def disconnect_oauth(db: Session, user: User, provider: str):
        """Déconnecter un fournisseur OAuth"""
        if user.oauth_provider != provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"L'utilisateur n'est pas connecté avec {provider}"
            )
            
        if not user.hashed_password or user.hashed_password == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous devez définir un mot de passe avant de déconnecter OAuth"
            )
            
        user.oauth_provider = None
        user.oauth_provider_id = None
        
        db.commit()
        db.refresh(user)
        return {"message": f"Déconnecté avec succès de {provider}"}