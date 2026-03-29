import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOCKED = "locked"
    DELETED = "deleted"


class User(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    email: str
    password: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True
        
class UserSecurity(BaseModel):
    user_id: uuid.UUID
    email_verified: bool = False
    email_verified_at: datetime | None = None
    password_change_at: datetime | None = None
    failed_login_attempts: int = 0
    locked_until: datetime | None = None

    class Config:
        orm_mode = True
        
class UserActivity(BaseModel):
    user_id: uuid.UUID
    last_login_at: datetime | None = None
    last_activity_at: datetime | None = None
    login_count: int = 0

    class Config:
        orm_mode = True
