from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models.file import File
from app.models.folder import Folder
from app.config import settings
from app.utils.security import create_folder_structure
import os
import uuid
import aiofiles
import shutil
import zipfile
import io
from pathlib import Path
import datetime

class StorageService:
    @staticmethod
    async def get_user_storage_info(db: Session, user_id: int):
        """
        Récupère les informations de stockage pour un utilisateur
        """
        storage_used_query = select(func.sum(File.size)).where(
            File.user_id == user_id,
            File.is_deleted == False
        )
        
        storage_used = db.execute(storage_used_query).scalar() or 0
        
        file_count_query = select(func.count(File.id)).where(
            File.user_id == user_id,
            File.is_deleted == False
        )
        
        file_count = db.execute(file_count_query).scalar() or 0
        
        folder_count_query = select(func.count(Folder.id)).where(
            Folder.user_id == user_id,
            Folder.is_deleted == False
        )
        
        folder_count = db.execute(folder_count_query).scalar() or 0
        
        user_query = select(User.storage_quota).where(User.id == user_id)
        storage_quota = db.execute(user_query).scalar_one() or settings.STORAGE_QUOTA
        
        return {
            "storage_used": storage_used,
            "storage_quota": storage_quota,
            "file_count": file_count,
            "folder_count": folder_count,
            "percentage_used": (storage_used / storage_quota) * 100 if storage_quota > 0 else 0
        }
    
    @staticmethod
    async def prepare_folder_download(db: Session, folder_id: int, user_id: int):
        """
        Prépare les données pour le téléchargement d'un dossier
        Retourne une structure récursive avec tous les fichiers et sous-dossiers
        """
        folder = db.execute(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.user_id == user_id,
                Folder.is_deleted == False
            )
        ).scalar_one_or_none()
        
        if not folder:
            return None
        
        def get_folder_contents(folder_id, path=""):
            result = {"files": {}, "folders": {}}
            
            files = db.execute(
                select(File).where(
                    File.folder_id == folder_id,
                    File.is_deleted == False
                )
            ).scalars().all()
            
            for file in files:
                result["files"][os.path.join(path, file.name)] = {
                    "id": file.id,
                    "name": file.name,
                    "path": file.storage_path,
                    "size": file.size,
                    "mime_type": file.mime_type
                }
            
            subfolders = db.execute(
                select(Folder).where(
                    Folder.parent_id == folder_id,
                    Folder.is_deleted == False
                )
            ).scalars().all()
            
            for subfolder in subfolders:
                subfolder_path = os.path.join(path, subfolder.name)
                result["folders"][subfolder_path] = subfolder.name
                
                subfolder_contents = get_folder_contents(subfolder.id, subfolder_path)
                
                result["files"].update(subfolder_contents["files"])
                result["folders"].update(subfolder_contents["folders"])
                
            return result
        
        contents = get_folder_contents(folder_id)
        
        return {
            "id": folder.id,
            "name": folder.name,
            "contents": contents
        }
    
    @staticmethod
    async def create_zip_from_folder(folder_data):
        """
        Crée un fichier ZIP à partir des données de dossier
        """
        zip_io = io.BytesIO()
        
        with zipfile.ZipFile(zip_io, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_file:
            for folder_path, folder_name in folder_data["contents"]["folders"].items():
                zip_file.writestr(folder_path + "/", "")
            
            for file_path, file_info in folder_data["contents"]["files"].items():
                try:
                    zip_file.write(file_info["path"], arcname=file_path)
                except Exception as e:
                    print(f"Erreur lors de l'ajout du fichier {file_path}: {str(e)}")
        
        zip_io.seek(0)
        return zip_io
    
    @staticmethod
    async def cleanup_storage():
        """
        Nettoie les fichiers orphelins du stockage
        À exécuter périodiquement
        """
        storage_files = []
        for root, _, files in os.walk(settings.UPLOAD_DIR):
            for file in files:
                storage_files.append(os.path.join(root, file))
                
        db_files = db.execute(select(File.storage_path)).scalars().all()
        
        orphaned_files = set(storage_files) - set(db_files)
        
        for file_path in orphaned_files:
            try:
                os.remove(file_path)
                print(f"Fichier orphelin supprimé: {file_path}")
            except Exception as e:
                print(f"Erreur lors de la suppression du fichier {file_path}: {str(e)}")
                
        return len(orphaned_files)