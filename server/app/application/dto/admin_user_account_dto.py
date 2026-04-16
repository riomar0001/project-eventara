import uuid
from dataclasses import dataclass, field
from datetime import datetime

from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender, UserStatus


@dataclass
class ListUserAccountsInput:
    page: int = 1
    page_size: int = 10
    search: str | None = None
    status: UserStatus | None = None


@dataclass
class RolePermissionSummary:
    feature_slug: str
    feature_name: str
    action: RoleAction
    effect: GrantEffect


@dataclass
class AdminUserAccountSummary:
    user_id: uuid.UUID
    name: str
    alias: str | None
    email: str
    role_id: uuid.UUID | None
    role_name: str | None
    status: UserStatus
    deletion_scheduled_for: datetime | None = None


@dataclass
class ListUserAccountsOutput:
    users: list[AdminUserAccountSummary]
    total_count: int
    page: int
    page_size: int
    total_pages: int


@dataclass
class AdminUserAccountDetail:
    user_id: uuid.UUID
    name: str
    email: str
    status: UserStatus
    role_id: uuid.UUID | None
    role_name: str | None
    alias: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    age_group: AgeGroup | None = None
    gender: Gender | None = None
    education_level: EducationLevel | None = None
    occupation: str | None = None
    bio: str | None = None
    onboarding_completed: bool = False
    onboarding_completed_at: datetime | None = None
    email_verified: bool = False
    email_verified_at: datetime | None = None
    password_change_at: datetime | None = None
    failed_login_attempts: int = 0
    locked_until: datetime | None = None
    last_login_at: datetime | None = None
    last_activity_at: datetime | None = None
    login_count: int = 0
    deletion_requested_at: datetime | None = None
    deletion_scheduled_for: datetime | None = None
    deletion_requested_by: uuid.UUID | None = None
    deletion_reason: str | None = None
    deleted_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    role_permissions: list[RolePermissionSummary] = field(default_factory=list)


@dataclass
class AssignableRoleDetail:
    id: uuid.UUID
    name: str
    description: str | None = None
    is_default: bool = False
    is_system: bool = False
    permissions: list[RolePermissionSummary] = field(default_factory=list)


@dataclass
class ChangeUserRoleInput:
    user_id: uuid.UUID
    role_id: uuid.UUID
    changed_by: uuid.UUID


@dataclass
class ChangeUserRoleOutput:
    user_id: uuid.UUID
    role_id: uuid.UUID
    role_name: str
    permissions: list[RolePermissionSummary] = field(default_factory=list)


@dataclass
class ChangeUserEmailInput:
    user_id: uuid.UUID
    email: str
    changed_by: uuid.UUID


@dataclass
class ChangeUserEmailOutput:
    user_id: uuid.UUID
    email: str


@dataclass
class SendUserPasswordResetInput:
    user_id: uuid.UUID
    requested_by: uuid.UUID


@dataclass
class ListAssignableRolesOutput:
    roles: list[AssignableRoleDetail]
