from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.share import Share
from app.models.file import File
from app.schemas.share import ShareCreate
import datetime

class ShareService:
    
    @staticmethod
    async def create_share(db: Session, file_id: int, share_data: ShareCreate):
        """
        Crée un lien de partage pour un fichier
        """
        
        file = db.execute(
            select(File).where(
                File.id == file_id,
                File.is_deleted == False
            )
        ).scalar_one_or_none()
        
        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fichier non trouvé"
            )
        
        
        token = Share.generate_token()
        
        
        db_share = Share(
            token=token,
            file_id=file_id,
            expires_at=share_data.expires_at
        )
        
        db.add(db_share)
        db.commit()
        db.refresh(db_share)
        
        return db_share
    
    @staticmethod
    async def get_user_shares(db: Session, user_id: int, file_id: int = None):
        """
        Récupère les liens de partage de l'utilisateur
        """
        query = select(Share).join(File).where(File.user_id == user_id)
        
        if file_id:
            query = query.where(Share.file_id == file_id)
            
        shares = db.execute(query).scalars().all()
        return shares
    
    @staticmethod
    async def delete_share(db: Session, share_id: int, user_id: int):
        """
        Supprime un lien de partage
        """
        
        share = db.execute(
            select(Share)
            .join(File)
            .where(
                Share.id == share_id,
                File.user_id == user_id
            )
        ).scalar_one_or_none()
        
        if not share:
            return False
            
        db.delete(share)
        db.commit()
        
        return True
    
    @staticmethod
    async def get_share_by_token(db: Session, token: str):
        """
        Récupère un partage par son token
        """
        share = db.execute(
            select(Share).where(Share.token == token)
        ).scalar_one_or_none()
        
        if not share:
            return None
            
        
        if share.expires_at and share.expires_at < datetime.datetime.now(datetime.timezone.utc):
            share.is_active = False
            db.commit()
            return None
            
        
        file = db.execute(
            select(File).where(
                File.id == share.file_id,
                File.is_deleted == False
            )
        ).scalar_one_or_none()
        
        if not file:
            return None
            
        return {
            "share": share,
            "file": file
        }