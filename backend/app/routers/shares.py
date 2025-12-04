from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.file import File
from app.models.share import Share
from app.schemas.share import ShareCreate, ShareResponse
from app.services.share_service import ShareService
from app.utils.dependencies import get_current_active_user
from app.config import settings
from pathlib import Path
import datetime

router = APIRouter()

@router.post("/{file_id}", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
async def create_share(
    file_id: int,
    share_data: ShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Créer un lien de partage pour un fichier
    
    - **file_id**: ID du fichier à partager
    - **expires_at**: Date d'expiration (optionnelle)
    """
    
    file = db.execute(
        select(File).where(
            File.id == file_id,
            File.user_id == current_user.id,
            File.is_deleted == False
        )
    ).scalar_one_or_none()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé"
        )
    
    return await ShareService.create_share(db, file_id, share_data)

@router.get("/", response_model=List[ShareResponse])
async def get_shares(
    file_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer la liste des liens de partage de l'utilisateur
    
    - **file_id**: Filtrer par fichier (optionnel)
    """
    return await ShareService.get_user_shares(db, current_user.id, file_id)

@router.delete("/{share_id}")
async def delete_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Supprimer un lien de partage
    
    - **share_id**: ID du lien à supprimer
    """
    success = await ShareService.delete_share(db, share_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lien de partage non trouvé"
        )
    
    return {"message": "Lien de partage supprimé avec succès"}

@router.get("/public/{token}")
async def access_shared_file(
    token: str,
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Accéder à un fichier partagé via un lien public
    Retourne les informations du fichier en JSON
    
    - **token**: Token unique du lien de partage
    """
    
    share = db.execute(
        select(Share).where(
            Share.token == token,
            Share.is_active == True
        )
    ).scalar_one_or_none()
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lien de partage invalide ou expiré"
        )
    
    
    if share.expires_at and share.expires_at < datetime.datetime.now(datetime.timezone.utc):
        share.is_active = False
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Ce lien de partage a expiré"
        )
    
    
    file = db.execute(
        select(File).where(
            File.id == share.file_id,
            File.is_deleted == False
        )
    ).scalar_one_or_none()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé ou supprimé"
        )
    
    filepath = Path(file.storage_path)
    if not filepath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé sur le serveur"
        )
    
    
    if request and request.query_params.get("download") == "1":
        return FileResponse(
            path=filepath,
            filename=file.original_name,
            media_type=file.mime_type
        )
    
    
    return {
        "id": file.id,
        "name": file.name,
        "original_name": file.original_name,
        "size": file.size,
        "mime_type": file.mime_type,
        "created_at": file.created_at.isoformat() if file.created_at else None
    }

@router.get("/public/{token}/download")
async def download_shared_file(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Télécharger un fichier partagé
    
    - **token**: Token unique du lien de partage
    """
    
    share = db.execute(
        select(Share).where(
            Share.token == token,
            Share.is_active == True
        )
    ).scalar_one_or_none()
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lien de partage invalide ou expiré"
        )
    
    
    if share.expires_at and share.expires_at < datetime.datetime.now(datetime.timezone.utc):
        share.is_active = False
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Ce lien de partage a expiré"
        )
    
    
    file = db.execute(
        select(File).where(
            File.id == share.file_id,
            File.is_deleted == False
        )
    ).scalar_one_or_none()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé ou supprimé"
        )
    
    filepath = Path(file.storage_path)
    if not filepath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé sur le serveur"
        )
    
    
    return FileResponse(
        path=filepath,
        filename=file.original_name,
        media_type=file.mime_type
    )