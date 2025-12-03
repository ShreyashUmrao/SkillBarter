from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")

class UserLogin(BaseModel):
    email: str
    password: str

class SkillCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str

class SkillUpdate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str

class UserSkillResponse(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    skills: List[UserSkillResponse] = []

    model_config = {
        "from_attributes": True
    }

class TradeRequestCreate(BaseModel):
    receiver_id: int
    skill_id: int

class TradeRequestResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    skill_id: int
    status: str
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class ChatMessageBase(BaseModel):
    sender_id: int
    receiver_id: int
    request_id: int
    message: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageOut(ChatMessageBase):
    id: Optional[int] = None
    timestamp: Optional[datetime] = None
    conversation_key: Optional[str] = None

    model_config = {
        "from_attributes": True
    }
