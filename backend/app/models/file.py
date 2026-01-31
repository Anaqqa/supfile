from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # name = nom modifiable, original_name = nom upload initial
    name = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    
    size = Column(BigInteger, nullable=False)
    mime_type = Column(String, nullable=True)
    
    # Chemin physique UUID pour éviter collisions
    storage_path = Column(String, nullable=False, unique=True)
    
    # Relations : appartenance utilisateur et dossier parent
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    
    # Soft delete : corbeille avant suppression définitive
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Horodatage automatique
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations back_populates pour navigation bidirectionnelle
    owner = relationship("User", back_populates="files")
    folder = relationship("Folder", back_populates="files")
    shares = relationship("Share", back_populates="file", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<File {self.name}>"