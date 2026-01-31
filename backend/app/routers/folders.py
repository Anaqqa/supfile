from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.folder import Folder
from app.schemas.file import FolderCreate, FolderResponse
from app.services.folder_service import FolderService
from app.utils.dependencies import get_current_active_user
import os
import zipfile
import io
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.post("/", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_data: FolderCreate,
    db: Session = Depends(get_db),
   current_user = Depends(get_current_active_user)
):
    """
    Création dossier avec validation parent si spécifié
    """
    return await FolderService.create_folder(db, folder_data, current_user.id)

@router.get("/", response_model=List[FolderResponse])
async def get_folders(
    parent_id: Optional[int] = None,
    show_deleted: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Liste dossiers avec filtres sur parent et corbeille
    """
    query = select(Folder).where(Folder.user_id == current_user.id)
    
    # Filtre corbeille
    if show_deleted:
        query = query.where(Folder.is_deleted == True)
    else:
        query = query.where(Folder.is_deleted == False)
        
        # Filtre parent (None = racine)
        if parent_id is not None:
            query = query.where(Folder.parent_id == parent_id)
        else:
            query = query.where(Folder.parent_id.is_(None))
    
    folders = db.execute(query).scalars().all()
    return folders

@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Détails dossier avec vérification propriété
    """
    folder = await FolderService.get_folder(db, folder_id, current_user.id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    
    return folder

@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: int,
    folder_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Mise à jour dossier : renommage ou déplacement avec validation cycles
    """
    folder = await FolderService.update_folder(db, folder_id, folder_data, current_user.id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    
    return folder

@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: int,
    permanent: bool = False,
    recursive: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Suppression dossier : recursive=True supprime contenu, permanent=True bypass corbeille
    """
    success = await FolderService.delete_folder(db, folder_id, current_user.id, permanent, recursive)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    
    return {"message": "Dossier supprimé avec succès"}

@router.post("/{folder_id}/restore")
async def restore_folder(
    folder_id: int,
    recursive: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Restauration dossier depuis corbeille avec contenu si recursive=True
    """
    success = await FolderService.restore_folder(db, folder_id, current_user.id, recursive)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé ou pas dans la corbeille"
        )
    
    return {"message": "Dossier restauré avec succès"}

@router.get("/{folder_id}/download")
async def download_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Téléchargement dossier complet en ZIP avec arborescence préservée
    """
    folder_data = await FolderService.get_folder_contents_for_download(db, folder_id, current_user.id)
    if not folder_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé ou vide"
        )
    
    # Création ZIP en mémoire (streaming)
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_file:
        folder_name = folder_data["name"]
        
        # Ajout fichiers avec chemins relatifs
        for file_path, file_info in folder_data["files"].items():
            zip_file.write(
                file_info["path"], 
                arcname=os.path.join(file_path, file_info["name"])
            )
    
    zip_io.seek(0)
    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={folder_name}.zip"}
    )