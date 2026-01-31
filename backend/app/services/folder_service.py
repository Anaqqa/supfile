from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from app.models.folder import Folder
from app.models.file import File
from app.models.user import User
from app.schemas.file import FolderCreate
import os
import datetime
from pathlib import Path

class FolderService:
    
    @staticmethod
    async def create_folder(db: Session, folder_data: FolderCreate, user_id: int):
        """
        Crée un nouveau dossier
        """
        # Validation parent si spécifié pour éviter dossiers orphelins
        if folder_data.parent_id:
            parent = db.execute(
                select(Folder).where(
                    Folder.id == folder_data.parent_id,
                    Folder.user_id == user_id,
                    Folder.is_deleted == False
                )
            ).scalar_one_or_none()
            
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Dossier parent non trouvé"
                )
        
        
        db_folder = Folder(
            name=folder_data.name,
            parent_id=folder_data.parent_id,
            user_id=user_id
        )
        
        db.add(db_folder)
        db.commit()
        db.refresh(db_folder)
        
        return db_folder
    
    @staticmethod
    async def get_user_folders(db: Session, user_id: int, parent_id: int | None = None, show_deleted: bool = False):
        """
        Récupère les dossiers de l'utilisateur, éventuellement filtrés par dossier parent
        """
        query = select(Folder).where(Folder.user_id == user_id)
        if show_deleted:
            query = query.where(Folder.is_deleted == True)
        else:
            query = query.where(Folder.is_deleted == False)
                
        if parent_id is not None:
            query = query.where(Folder.parent_id == parent_id)
        else:
            query = query.where(Folder.parent_id.is_(None))
                
        folders = db.execute(query).scalars().all()
        return folders
    
    @staticmethod
    async def get_folder(db: Session, folder_id: int, user_id: int):
        """
        Récupère un dossier par ID, vérifie qu'il appartient à l'utilisateur
        """
        folder = db.execute(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.user_id == user_id
            )
        ).scalar_one_or_none()
        
        return folder
    
    @staticmethod
    async def update_folder(db: Session, folder_id: int, folder_data: dict, user_id: int):
        """
        Met à jour un dossier (renommage, déplacement)
        """
        folder = await FolderService.get_folder(db, folder_id, user_id)
        if not folder:
            return None
            
        
        if folder_data.get('parent_id') is not None:
            if folder_data['parent_id'] == 0:  
                folder.parent_id = None
            else:
                # Empêche déplacement vers soi-même
                if folder_data['parent_id'] == folder_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Un dossier ne peut pas être son propre parent"
                    )
                    
                # Détection cycle : empêche A->B->C->A
                def is_descendant(parent_id, child_id):
                    if parent_id is None:
                        return False
                        
                    child = db.execute(
                        select(Folder).where(Folder.id == child_id)
                    ).scalar_one_or_none()
                    
                    if child is None:
                        return False
                        
                    if child.parent_id == parent_id:
                        return True
                        
                    if child.parent_id is None:
                        return False
                        
                    return is_descendant(parent_id, child.parent_id)
                
                if is_descendant(folder_id, folder_data['parent_id']):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Un dossier ne peut pas être déplacé vers l'un de ses sous-dossiers"
                    )
                
                parent = db.execute(
                    select(Folder).where(
                        Folder.id == folder_data['parent_id'],
                        Folder.user_id == user_id,
                        Folder.is_deleted == False
                    )
                ).scalar_one_or_none()
                
                if not parent:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Dossier parent non trouvé"
                    )
                    
                folder.parent_id = folder_data['parent_id']
        
        
        if folder_data.get('name'):
            folder.name = folder_data['name']
            
        db.commit()
        db.refresh(folder)
        
        return folder
    
    @staticmethod
    async def delete_folder(db: Session, folder_id: int, user_id: int, permanent: bool = False, recursive: bool = True):
        """
        Supprime un dossier et éventuellement son contenu (corbeille ou définitif)
        """
        folder = await FolderService.get_folder(db, folder_id, user_id)
        if not folder:
            return False
            
        if permanent:
            
            if recursive:
                # Récupération récursive contenu avant suppression
                files, subfolders = await FolderService._get_folder_contents_recursive(db, folder_id)
                
                # Suppression physique fichiers + libération quota
                for file in files:
                    if os.path.exists(file.storage_path):
                        os.remove(file.storage_path)
                        
                    
                    db.execute(
                        update(User)
                        .where(User.id == user_id)
                        .values(storage_used=User.storage_used - file.size)
                    )
                    
                    db.delete(file)
                
                # Suppression cascade dossiers
                for subfolder in subfolders:
                    db.delete(subfolder)
                    
                
                db.delete(folder)
            else:
                
                files = db.execute(
                    select(File).where(
                        File.folder_id == folder_id,
                        File.is_deleted == False
                    )
                ).scalars().all()
                
                subfolders = db.execute(
                    select(Folder).where(
                        Folder.parent_id == folder_id,
                        Folder.is_deleted == False
                    )
                ).scalars().all()
                
                if files or subfolders:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Le dossier n'est pas vide"
                    )
                    
                
                db.delete(folder)
        else:
            
            if recursive:
                
                await FolderService._mark_as_deleted_recursive(db, folder_id)
            
            now = datetime.datetime.now(datetime.timezone.utc)
            db.execute(
                update(Folder)
                .where(Folder.id == folder_id)
                .values(is_deleted=True, deleted_at=now)
            )
            
        db.commit()
        return True
    
    @staticmethod
    async def restore_folder(db: Session, folder_id: int, user_id: int, recursive: bool = True):
        """
        Restaure un dossier depuis la corbeille
        """
        folder = db.execute(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.user_id == user_id,
                Folder.is_deleted == True
            )
        ).scalar_one_or_none()
        
        if not folder:
            return False
            
        # Vérification parent toujours actif
        if folder.parent_id is not None:
            parent = db.execute(
                select(Folder).where(
                    Folder.id == folder.parent_id,
                    Folder.is_deleted == False
                )
            ).scalar_one_or_none()
            
            # Déplacement racine si parent supprimé
            if not parent:
                db.execute(
                    update(Folder)
                    .where(Folder.id == folder_id)
                    .values(parent_id=None)
                )
                
        db.execute(
            update(Folder)
            .where(Folder.id == folder_id)
            .values(is_deleted=False, deleted_at=None)
        )
        
        # Restauration cascade contenu
        if recursive:
            
            await FolderService._restore_contents_recursive(db, folder_id)
        
        db.commit()
        return True
    
    @staticmethod
    async def get_folder_contents_for_download(db: Session, folder_id: int, user_id: int):
        """
        Récupère tous les fichiers et sous-dossiers pour le téléchargement ZIP
        """
        folder = await FolderService.get_folder(db, folder_id, user_id)
        if not folder:
            return None
            
        
        result = {
            "id": folder.id,
            "name": folder.name,
            "files": {}  
        }
        
        # Construction récursive arborescence pour ZIP
        await FolderService._add_folder_contents_to_result(db, folder_id, result["files"], "")
        
        return result
    
    @staticmethod
    async def _add_folder_contents_to_result(db: Session, folder_id: int, files_dict: dict, current_path: str):
        """
        Fonction auxiliaire récursive pour construire la structure de téléchargement
        """
        # Parcours récursif avec préservation chemins relatifs
        files = db.execute(
            select(File).where(
                File.folder_id == folder_id,
                File.is_deleted == False
            )
        ).scalars().all()
        
        
        for file in files:
            file_path = os.path.join(current_path, str(file.name))
            files_dict[file_path] = {
                "name": file.name,
                "path": file.storage_path,
                "size": file.size,
                "mime_type": file.mime_type
            }
        
        # Descente récursive sous-dossiers
        subfolders = db.execute(
            select(Folder).where(
                Folder.parent_id == folder_id,
                Folder.is_deleted == False
            )
        ).scalars().all()
        
        
        for subfolder in subfolders:
            subfolder_path = os.path.join(current_path, str(subfolder.name))
            await FolderService._add_folder_contents_to_result(db, subfolder.id, files_dict, subfolder_path)
    
    @staticmethod
    async def _get_folder_contents_recursive(db: Session, folder_id: int):
        """
        Récupère tous les fichiers et sous-dossiers de manière récursive
        """
        files = []
        folders = []
        
        
        folder_files = db.execute(
            select(File).where(File.folder_id == folder_id)
        ).scalars().all()
        
        files.extend(folder_files)
        
        
        subfolders = db.execute(
            select(Folder).where(Folder.parent_id == folder_id)
        ).scalars().all()
        
        folders.extend(subfolders)
        
        
        for subfolder in subfolders:
            subfolder_files, subfolder_folders = await FolderService._get_folder_contents_recursive(db, subfolder.id)
            files.extend(subfolder_files)
            folders.extend(subfolder_folders)
            
        return files, folders
    
    @staticmethod
    async def _mark_as_deleted_recursive(db: Session, folder_id: int):
        """
        Marque tous les fichiers et sous-dossiers comme supprimés
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        
        
        db.execute(
            update(File)
            .where(File.folder_id == folder_id, File.is_deleted == False)
            .values(is_deleted=True, deleted_at=now)
        )
        
        
        subfolders = db.execute(
            select(Folder).where(
                Folder.parent_id == folder_id,
                Folder.is_deleted == False
            )
        ).scalars().all()
        
        
        for subfolder in subfolders:
            db.execute(
                update(Folder)
                .where(Folder.id == subfolder.id)
                .values(is_deleted=True, deleted_at=now)
            )
            
            
            await FolderService._mark_as_deleted_recursive(db, subfolder.id)
    
    @staticmethod
    async def _restore_contents_recursive(db: Session, folder_id: int):
        """
        Restaure tous les fichiers et sous-dossiers d'un dossier
        """
        
        db.execute(
            update(File)
            .where(File.folder_id == folder_id, File.is_deleted == True)
            .values(is_deleted=False, deleted_at=None)
        )
        
        
        subfolders = db.execute(
            select(Folder).where(
                Folder.parent_id == folder_id,
                Folder.is_deleted == True
            )
        ).scalars().all()
        
        
        for subfolder in subfolders:
            db.execute(
                update(Folder)
                .where(Folder.id == subfolder.id)
                .values(is_deleted=False, deleted_at=None)
            )
            
            
            await FolderService._restore_contents_recursive(db, subfolder.id)
    
    @staticmethod
    async def search_folders(db: Session, user_id: int, search_term: str, folder_id: int = None):
        """
        Recherche des dossiers par nom
        """
        query = select(Folder).where(
            Folder.user_id == user_id,
            Folder.is_deleted == False,
            Folder.name.ilike(f"%{search_term}%")
        )
        
        if folder_id is not None:
            query = query.where(Folder.parent_id == folder_id)
            
        folders = db.execute(query).scalars().all()
        return folders