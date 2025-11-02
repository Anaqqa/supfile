from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FileBase(BaseModel):
    name: str
    folder_id: Optional[int] = None

class FileCreate(FileBase):
    pass

class FileUpdate(BaseModel):
    name: Optional[str] = None
    folder_id: Optional[int] = None

class FileResponse(FileBase):
    id: int
    original_name: str
    size: int
    mime_type: Optional[str]
    user_id: int
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class FileUploadResponse(BaseModel):
    id: int
    name: str
    size: int
    mime_type: Optional[str]
    message: str = "File uploaded successfully"

class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None

class FolderResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int]
    user_id: int
    is_deleted: bool
    created_at: datetime
    
    class Config:
        from_attributes = True