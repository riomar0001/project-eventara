import uuid
from dataclasses import dataclass
from datetime import datetime

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
class AttendedEventRecord:
    participant_id: uuid.UUID
    event_id: uuid.UUID
    event_title: str
    event_start_date: datetime
    event_end_date: datetime
    event_banner_url: str | None
    session_id: uuid.UUID
    session_title: str
    session_start_datetime: datetime
    session_end_datetime: datetime
    attended_at: datetime | None


@dataclass
class GetEventsAttendedInput:
    user_id: uuid.UUID
    limit: int = 10


@dataclass
class GetEventsAttendedOutput:
    events: list[AttendedEventRecord]


@dataclass
class GetUserDetailsInput:
    user_id: uuid.UUID
    attended_events_limit: int = 10


@dataclass
class GetUserDetailsOutput:
    profile: UserProfile
    events_attended: list[AttendedEventRecord]
    role_name: str | None


@dataclass
class GetLoginHistoryInput:
    user_id: uuid.UUID
    limit: int = 10


@dataclass
class GetLoginHistoryOutput:
    entries: list[UserLoginHistory]
