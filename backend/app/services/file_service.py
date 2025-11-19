from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from app.models.file import File
from app.models.user import User
from app.models.folder import Folder
from app.schemas.file import FileCreate, FileUpdate, FileUploadResponse
from app.config import settings
import os
import uuid
import aiofiles
import magic
import datetime
from pathlib import Path
import shutil

class FileService:
    
    @staticmethod
    async def upload_file(db: Session, user: User, file: UploadFile, folder_id: int = None):
        """
        Téléverse un fichier sur le serveur et crée l'entrée en base de données
        """
        file.file.seek(0, 2)  
        file_size = file.file.tell()  
        file.file.seek(0)  
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Le fichier est trop volumineux (max: {settings.MAX_FILE_SIZE // 1024 // 1024} Mo)"
            )
            
        if user.storage_used + file_size > user.storage_quota:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Quota de stockage dépassé"
            )
        
        if folder_id:
            folder = db.execute(
                select(Folder).where(
                    Folder.id == folder_id,
                    Folder.user_id == user.id,
                    Folder.is_deleted == False
                )
            ).scalar_one_or_none()
            
            if not folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Dossier non trouvé"
                )
        
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_uuid = str(uuid.uuid4())
        file_path = os.path.join(settings.UPLOAD_DIR, file_uuid)
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        mime_type = magic.from_file(file_path, mime=True)
        
        db_file = File(
            name=file.filename,
            original_name=file.filename,
            size=file_size,
            mime_type=mime_type,
            storage_path=file_path,
            user_id=user.id,
            folder_id=folder_id
        )
        
        db.add(db_file)
        
        user.storage_used += file_size
        
        db.commit()
        db.refresh(db_file)
        
        return FileUploadResponse(
            id=db_file.id,
            name=db_file.name,
            size=db_file.size,
            mime_type=db_file.mime_type,
            message="Fichier téléversé avec succès"
        )
    
    @staticmethod
    async def get_user_files(db: Session, user_id: int, folder_id: int = None, show_deleted: bool = False):
        """
        Récupère les fichiers de l'utilisateur, éventuellement filtrés par dossier
        """
        query = select(File).where(File.user_id == user_id)
        
        if not show_deleted:
            query = query.where(File.is_deleted == False)
            
        if folder_id is not None:
            query = query.where(File.folder_id == folder_id)
        else:
            query = query.where(File.folder_id.is_(None))
            
        files = db.execute(query).scalars().all()
        return files
    
    @staticmethod
    async def get_file(db: Session, file_id: int, user_id: int):
        """
        Récupère un fichier par ID, vérifie qu'il appartient à l'utilisateur
        """
        file = db.execute(
            select(File).where(
                File.id == file_id,
                File.user_id == user_id
            )
        ).scalar_one_or_none()
        
        return file
    
    @staticmethod
    async def get_file_with_path(db: Session, file_id: int, user_id: int):
        """
        Récupère un fichier par ID avec son chemin physique
        """
        file = await FileService.get_file(db, file_id, user_id)
        if not file:
            return None
        
        if not os.path.exists(file.storage_path):
            return None
            
        return file
    
    @staticmethod
    async def update_file(db: Session, file_id: int, file_data: FileUpdate, user_id: int):
        """
        Met à jour un fichier (renommage, déplacement)
        """
        file = await FileService.get_file(db, file_id, user_id)
        if not file:
            return None
            
        if file_data.folder_id is not None:
            if file_data.folder_id == 0:  
                file.folder_id = None
            else:
                folder = db.execute(
                    select(Folder).where(
                        Folder.id == file_data.folder_id,
                        Folder.user_id == user_id,
                        Folder.is_deleted == False
                    )
                ).scalar_one_or_none()
                
                if not folder:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Dossier de destination non trouvé"
                    )
                    
                file.folder_id = file_data.folder_id
        
        if file_data.name:
            file.name = file_data.name
            
        db.commit()
        db.refresh(file)
        
        return file
    
    @staticmethod
    async def delete_file(db: Session, file_id: int, user_id: int, permanent: bool = False):
        """
        Supprime un fichier (corbeille ou définitif)
        """
        file = await FileService.get_file(db, file_id, user_id)
        if not file:
            return False
            
        if permanent:
            if os.path.exists(file.storage_path):
                os.remove(file.storage_path)
                
            user = db.execute(select(User).where(User.id == user_id)).scalar_one()
            user.storage_used = max(0, user.storage_used - file.size)
                
            db.delete(file)
        else:
            file.is_deleted = True
            file.deleted_at = datetime.datetime.now(datetime.timezone.utc)
            
        db.commit()
        return True
    
    @staticmethod
    async def restore_file(db: Session, file_id: int, user_id: int):
        """
        Restaure un fichier depuis la corbeille
        """
        file = db.execute(
            select(File).where(
                File.id == file_id,
                File.user_id == user_id,
                File.is_deleted == True
            )
        ).scalar_one_or_none()
        
        if not file:
            return False
        
        if file.folder_id:
            folder = db.execute(
                select(Folder).where(
                    Folder.id == file.folder_id,
                    Folder.is_deleted == False
                )
            ).scalar_one_or_none()
            
            if not folder:
                file.folder_id = None
        
        file.is_deleted = False
        file.deleted_at = None
        db.commit()
        
        return True
    
    @staticmethod
    async def get_trashed_files(db: Session, user_id: int):
        """
        Récupère tous les fichiers dans la corbeille de l'utilisateur
        """
        files = db.execute(
            select(File).where(
                File.user_id == user_id,
                File.is_deleted == True
            )
        ).scalars().all()
        
        return files
    
    @staticmethod
    async def empty_trash(db: Session, user_id: int):
        """
        Vide la corbeille de l'utilisateur (suppression définitive)
        """
        trashed_files = await FileService.get_trashed_files(db, user_id)
        
        space_freed = 0
        for file in trashed_files:
            if os.path.exists(file.storage_path):
                os.remove(file.storage_path)
                
            space_freed += file.size
            db.delete(file)
        
        if space_freed > 0:
            user = db.execute(select(User).where(User.id == user_id)).scalar_one()
            user.storage_used = max(0, user.storage_used - space_freed)
            
        db.commit()
        
        return len(trashed_files)
    
    @staticmethod
    async def search_files(db: Session, user_id: int, search_term: str, folder_id: int = None):
        """
        Recherche des fichiers par nom
        """
        query = select(File).where(
            File.user_id == user_id,
            File.is_deleted == False,
            File.name.ilike(f"%{search_term}%")
        )
        
        if folder_id is not None:
            query = query.where(File.folder_id == folder_id)
            
        files = db.execute(query).scalars().all()
        return files