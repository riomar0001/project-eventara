import uuid
from datetime import datetime
from typing import Optional

from pydantic import AwareDatetime, BaseModel, Field

from app.domain.entities.authorization_entities import GrantEffect, RoleAction


class AssignRoleRequest(BaseModel):
    user_id: uuid.UUID
    role_id: uuid.UUID
    expires_at: Optional[AwareDatetime] = None


class UpdateAssignmentRequest(BaseModel):
    expires_at: Optional[AwareDatetime] = Field(
        default=...,
        description="New expiry date for the assignment. Pass null to remove the expiry.",
    )


class UserRoleAssignmentResponse(BaseModel):
    success: bool = True
    id: uuid.UUID
    user_id: uuid.UUID
    role_id: uuid.UUID
    expires_at: datetime | None
    assigned_by: uuid.UUID | None
    assigned_at: datetime

    model_config = {"from_attributes": True}


class UserRoleListResponse(BaseModel):
    success: bool = True
    data: list[UserRoleAssignmentResponse]
    total: int


class CreateGrantsRequest(BaseModel):
    user_id: uuid.UUID
    role_id: uuid.UUID
    feature_id: uuid.UUID
    actions: list[RoleAction] = Field(
        min_length=1,
        description="One or more role actions to grant. Duplicates within the list are ignored.",
    )
    effect: GrantEffect = GrantEffect.ALLOW
    starts_at: Optional[AwareDatetime] = None
    expires_at: Optional[AwareDatetime] = None
    reason: str | None = Field(default=None, max_length=500)


class GrantFeatureResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str | None = None
    is_enabled: bool

    model_config = {"from_attributes": True}


class GrantFeatureListResponse(BaseModel):
    success: bool = True
    data: list[GrantFeatureResponse]


class UserGrantResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    feature_id: uuid.UUID
    role_id: uuid.UUID
    action: RoleAction
    effect: GrantEffect
    reason: str | None
    starts_at: datetime | None
    expires_at: datetime | None
    granted_by: uuid.UUID | None

    model_config = {"from_attributes": True}


class CreateGrantsResponse(BaseModel):
    success: bool = True
    data: list[UserGrantResponse]
    message: str = "Grants created successfully."


class UserGrantListResponse(BaseModel):
    success: bool = True
    data: list[UserGrantResponse]
    total: int
