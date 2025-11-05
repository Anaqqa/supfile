from pydantic import BaseModel
from typing import Optional, Dict, Any

class OAuthCallbackRequest(BaseModel):
    code: str

class OAuthProviderInfo(BaseModel):
    provider: str
    provider_id: str
    provider_user_info: Dict[str, Any]
    
    class Config:
        from_attributes = True

class OAuthDisconnectRequest(BaseModel):
    provider: str