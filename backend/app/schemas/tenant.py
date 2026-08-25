from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.schemas.user import User as UserSchema


class TenantBase(BaseModel):
    name: str


class TenantCreate(TenantBase):
    pass


class TenantCreateWithAdmin(TenantBase):
    admin_username: str
    admin_email: EmailStr


class Tenant(TenantBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    users: List[UserSchema] = []

    class Config:
        from_attributes = True
