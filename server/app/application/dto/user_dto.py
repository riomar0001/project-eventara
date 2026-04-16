import uuid
from datetime import datetime
from dataclasses import dataclass

from app.domain.entities.user_entity import (
    AgeGroup,
    EducationLevel,
    Gender,
    UserLoginHistory,
    UserProfile,
)


@dataclass
class UserOnboardingInput:
    user_id: uuid.UUID
    alias: str
    first_name: str
    last_name: str
    age_group: AgeGroup
    gender: Gender
    education_level: EducationLevel
    occupation: str | None = None
    bio: str | None = None


@dataclass
class UserOnboardingOutput:
    profile: UserProfile


@dataclass
class ChangePasswordInput:
    user_id: uuid.UUID
    current_password: str
    new_password: str


@dataclass
class GetLoginHistoryInput:
    user_id: uuid.UUID
    limit: int = 10


@dataclass
class GetLoginHistoryOutput:
    entries: list[UserLoginHistory]


@dataclass
class RequestAccountDeletionInput:
    target_user_id: uuid.UUID
    requested_by: uuid.UUID
    reason: str | None = None
    current_password: str | None = None


@dataclass
class RequestAccountDeletionOutput:
    user_id: uuid.UUID
    deletion_requested_at: datetime
    deletion_scheduled_for: datetime
    requested_by: uuid.UUID
