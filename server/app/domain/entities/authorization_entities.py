import uuid
from datetime import datetime, timezone
from enum import StrEnum

from pydantic import BaseModel, Field


class GrantEffect(StrEnum):
    ALLOW = "allow"
    DENY = "deny"


class RoleAction(StrEnum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"


class Feature(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    slug: str
    name: str
    description: str | None = None
    is_enabled: bool = True

    model_config = {"from_attributes": True}


class Role(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    description: str | None = None
    is_default: bool = False
    is_system: bool = False

    model_config = {"from_attributes": True}


class RolePermission(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    role_id: uuid.UUID
    feature_id: uuid.UUID
    action: RoleAction
    effect: GrantEffect

    model_config = {"from_attributes": True}


class UserRole(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    role_id: uuid.UUID
    expires_at: datetime | None = None
    assigned_by: uuid.UUID | None = None
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"from_attributes": True}


class UserGrant(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    feature_id: uuid.UUID
    role_id: uuid.UUID
    action: RoleAction
    effect: GrantEffect
    reason: str | None = None
    expires_at: datetime | None = None
    granted_by: uuid.UUID | None = None

    model_config = {"from_attributes": True}
