from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse as FastAPIFileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.file import File as FileModel
from app.models.folder import Folder
from app.schemas.file import FileResponse, FileCreate, FileUpdate, FileUploadResponse
from app.services.file_service import FileService
from app.utils.dependencies import get_current_active_user
import os
from pathlib import Path

router = APIRouter()

@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    folder_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Téléverser un fichier avec validation quota et dossier parent
    """
    return await FileService.upload_file(db, current_user, file, folder_id)

@router.get("/", response_model=List[FileResponse])
async def get_files(
    folder_id: Optional[int] = None,
    show_deleted: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Liste fichiers utilisateur avec filtres sur dossier et corbeille
    """
    query = select(FileModel).where(FileModel.user_id == current_user.id)
    
    # Filtre corbeille : show_deleted=True affiche uniquement corbeille
    if show_deleted:
        query = query.where(FileModel.is_deleted == True)
    else:
        query = query.where(FileModel.is_deleted == False)
        
        # Filtre dossier parent (None = racine)
        if folder_id is not None:
            query = query.where(FileModel.folder_id == folder_id)
        else:
            query = query.where(FileModel.folder_id.is_(None))
    
    files = db.execute(query).scalars().all()
    return files

@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Détails fichier avec vérification propriété
    """
    file = await FileService.get_file(db, file_id, current_user.id)
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé"
        )
    
    return file

@router.put("/{file_id}", response_model=FileResponse)
async def update_file(
    file_id: int,
    file_data: FileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mise à jour fichier : renommage ou déplacement
    """
    file = await FileService.update_file(db, file_id, file_data, current_user.id)
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé"
        )
    
    return file

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    permanent: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Suppression fichier : corbeille (soft) ou définitive (hard)
    """
    success = await FileService.delete_file(db, file_id, current_user.id, permanent)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé"
        )
    
    return {"message": "Fichier supprimé avec succès"}

@router.post("/{file_id}/restore")
async def restore_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Restauration fichier depuis corbeille
    """
    success = await FileService.restore_file(db, file_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé ou pas dans la corbeille"
        )
    
    return {"message": "Fichier restauré avec succès"}

@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Téléchargement fichier avec nom original préservé
    """
    file = await FileService.get_file_with_path(db, file_id, current_user.id)
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé"
        )
    
    filepath = Path(file.storage_path)
    if not filepath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé sur le serveur"
        )
    
    # Header Content-Disposition force le téléchargement
    return FastAPIFileResponse(
        path=filepath,
        filename=file.original_name,
        media_type=file.mime_type
    )

@router.get("/{file_id}/preview")
async def preview_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Prévisualisation fichier sans header download (affichage navigateur)
    """
    file = await FileService.get_file_with_path(db, file_id, current_user.id)
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé"
        )
    
    filepath = Path(file.storage_path)
    if not filepath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé sur le serveur"
        )
    
    # Pas de Content-Disposition = affichage navigateur
    return FastAPIFileResponse(
        path=filepath,
        media_type=file.mime_type
    )

@router.get("/search")
async def search_items(
    q: str,
    folder_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Recherche fichiers et dossiers par nom (case insensitive)
    """
    from app.services.folder_service import FolderService
    
    files = await FileService.search_files(db, current_user.id, q, folder_id)
    folders = await FolderService.search_folders(db, current_user.id, q, folder_id)
    
    return {
        "files": files,
        "folders": folders
    }