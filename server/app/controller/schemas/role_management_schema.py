import uuid

from pydantic import BaseModel, Field

from app.domain.entities.authorization_entities import GrantEffect, RoleAction


class RolePermissionRequest(BaseModel):
    feature_id: uuid.UUID
    actions: list[RoleAction] = Field(min_length=1)
    effect: GrantEffect = GrantEffect.ALLOW


class RolePermissionRecordResponse(BaseModel):
    feature_id: uuid.UUID
    feature_slug: str
    feature_name: str
    action: RoleAction
    effect: GrantEffect


class RoleCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    is_default: bool = False
    is_system: bool = False
    permissions: list[RolePermissionRequest] = Field(default_factory=list)


class RoleUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    is_default: bool = False
    is_system: bool = False
    permissions: list[RolePermissionRequest] = Field(default_factory=list)


class RoleRecordResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    is_default: bool = False
    is_system: bool = False
    permissions: list[RolePermissionRecordResponse] = Field(default_factory=list)


class RoleResponse(BaseModel):
    success: bool = True
    data: RoleRecordResponse
    message: str = "Role saved successfully."


class RoleListResponse(BaseModel):
    success: bool = True
    data: list[RoleRecordResponse]
