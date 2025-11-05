from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ShareBase(BaseModel):
    expires_at: Optional[datetime] = None

class ShareCreate(ShareBase):
    pass

class ShareResponse(ShareBase):
    id: int
    token: str
    file_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True