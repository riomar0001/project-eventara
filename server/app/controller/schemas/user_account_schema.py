import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender, UserStatus


class AdminUserAccountSummaryResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    email: str
    role_id: uuid.UUID | None = None
    role_name: str | None = None
    status: UserStatus
    deletion_scheduled_for: datetime | None = None


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
    onboarding_completed_at: datetime | None = None
    email_verified: bool
    email_verified_at: datetime | None = None
    password_change_at: datetime | None = None
    failed_login_attempts: int
    locked_until: datetime | None = None
    last_login_at: datetime | None = None
    last_activity_at: datetime | None = None
    login_count: int
    deletion_requested_at: datetime | None = None
    deletion_scheduled_for: datetime | None = None
    deletion_requested_by: uuid.UUID | None = None
    deletion_reason: str | None = None
    deleted_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AssignableRoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    is_default: bool = False
    is_system: bool = False


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
