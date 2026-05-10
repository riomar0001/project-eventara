import uuid
from dataclasses import dataclass

from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender, UserLoginHistory, UserProfile


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
class UpdateProfileInput:
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
class UpdateProfileOutput:
    profile: UserProfile
    previous_profile: UserProfile


@dataclass
class UpdateProfileAvatarInput:
    user_id: uuid.UUID
    image_url: str


@dataclass
class UpdateProfileAvatarOutput:
    profile: UserProfile
    old_image_url: str | None


@dataclass
class GetLoginHistoryInput:
    user_id: uuid.UUID
    limit: int = 10


@dataclass
class GetLoginHistoryOutput:
    entries: list[UserLoginHistory]
