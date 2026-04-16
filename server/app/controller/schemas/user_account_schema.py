import uuid
from datetime import UTC, datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, PlainSerializer

from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender, UserStatus


def _serialize_datetime_as_utc_z(value: datetime) -> str:
    normalized = value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
    return normalized.isoformat().replace("+00:00", "Z")


UtcJsonDatetime = Annotated[
    datetime,
    PlainSerializer(_serialize_datetime_as_utc_z, return_type=str, when_used="json"),
]


class AdminUserAccountSummaryResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    alias: str | None = None
    email: str
    role_id: uuid.UUID | None = None
    role_name: str | None = None
    status: UserStatus
    deletion_scheduled_for: UtcJsonDatetime | None = None


class AdminUserAccountPaginationResponse(BaseModel):
    page: int
    page_size: int
    total_count: int
    total_pages: int
    has_next: bool
    has_previous: bool


class AdminUserAccountListResponse(BaseModel):
    success: bool = True
    data: list[AdminUserAccountSummaryResponse]
    pagination: AdminUserAccountPaginationResponse


class RolePermissionResponse(BaseModel):
    feature_slug: str
    feature_name: str
    action: RoleAction
    effect: GrantEffect


class AdminUserAccountDetailResponse(BaseModel):
    success: bool = True
    user_id: uuid.UUID
    name: str
    email: str
    status: UserStatus
    role_id: uuid.UUID | None = None
    role_name: str | None = None
    alias: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    age_group: AgeGroup | None = None
    gender: Gender | None = None
    education_level: EducationLevel | None = None
    occupation: str | None = None
    bio: str | None = None
    onboarding_completed: bool
    onboarding_completed_at: UtcJsonDatetime | None = None
    email_verified: bool
    email_verified_at: UtcJsonDatetime | None = None
    password_change_at: UtcJsonDatetime | None = None
    failed_login_attempts: int
    locked_until: UtcJsonDatetime | None = None
    last_login_at: UtcJsonDatetime | None = None
    last_activity_at: UtcJsonDatetime | None = None
    login_count: int
    deletion_requested_at: UtcJsonDatetime | None = None
    deletion_scheduled_for: UtcJsonDatetime | None = None
    deletion_requested_by: uuid.UUID | None = None
    deletion_reason: str | None = None
    deleted_at: UtcJsonDatetime | None = None
    created_at: UtcJsonDatetime | None = None
    updated_at: UtcJsonDatetime | None = None
    role_permissions: list[RolePermissionResponse] = Field(default_factory=list)


class AssignableRoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    is_default: bool = False
    is_system: bool = False
    permissions: list[RolePermissionResponse] = Field(default_factory=list)


class AssignableRoleListResponse(BaseModel):
    success: bool = True
    data: list[AssignableRoleResponse]


class ChangeUserRoleRequest(BaseModel):
    role_id: uuid.UUID


class ChangeUserRoleResponse(BaseModel):
    success: bool = True
    user_id: uuid.UUID
    role_id: uuid.UUID
    role_name: str
    permissions: list[RolePermissionResponse] = Field(default_factory=list)
    message: str = "User role updated successfully."


class ChangeUserEmailRequest(BaseModel):
    email: EmailStr


class ChangeUserEmailResponse(BaseModel):
    success: bool = True
    user_id: uuid.UUID
    email: EmailStr
    message: str = "User email updated successfully. A new verification link has been sent."


class SendUserPasswordResetResponse(BaseModel):
    success: bool = True
    message: str = "Password reset link sent successfully."


class AdminScheduleAccountDeletionRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)
