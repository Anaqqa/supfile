from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas.user import UserCreate
from app.schemas.auth import LoginRequest
from app.utils.security import hash_password, verify_password, create_access_token

class AuthService:
    
    @staticmethod
    def register_user(db: Session, user_data: UserCreate):
        """
        Crée un nouveau compte utilisateur
        """
        from app.models.user import User
        
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_pwd = hash_password(user_data.password)
        
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_pwd,
            full_name=user_data.full_name,
            is_active=True,
            is_verified=False,
            storage_used=0,
            storage_quota=32212254720
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user
    
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> dict:
        """
        Authentifie un utilisateur et retourne un token JWT
        """
        from app.models.user import User
        
        user = db.query(User).filter(User.email == login_data.email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        access_token = create_access_token(data={"sub": user.id, "email": user.email})
        
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
    
    @staticmethod
    def get_user_by_email(db: Session, email: str):
        """
        Récupère un utilisateur par son email
        """
        from app.models.user import User
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        """
        Récupère un utilisateur par son ID
        """
        from app.models.user import User
        return db.query(User).filter(User.id == user_id).first()