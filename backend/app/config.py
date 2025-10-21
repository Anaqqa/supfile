from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SUPFile"
    ENVIRONMENT: str = "development"
    
    DATABASE_URL: str
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None
    
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE: int = 5368709120
    STORAGE_QUOTA: int = 32212254720
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()