import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class UserStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOCKED = "locked"
    DELETED = "deleted"


class AgeGroup(StrEnum):
    CHILD = "child"
    TEEN = "teen"
    ADULT = "adult"
    SENIOR = "senior"


class Gender(StrEnum):
    MALE = "male"
    FEMALE = "female"


class EducationLevel(StrEnum):
    NO_FORMAL_EDUCATION = "no_formal_education"
    ELEMENTARY_LEVEL = "elementary_level"
    ELEMENTARY_GRADUATE = "elementary_graduate"
    JUNIOR_HIGH_SCHOOL_LEVEL = "junior_high_school_level"
    JUNIOR_HIGH_SCHOOL_GRADUATE = "junior_high_school_graduate"
    SENIOR_HIGH_SCHOOL_LEVEL = "senior_high_school_level"
    SENIOR_HIGH_SCHOOL_GRADUATE = "senior_high_school_graduate"
    VOCATIONAL_TRADE_CERTIFICATE = "vocational_trade_certificate"
    COLLEGE_LEVEL_UNDERGRADUATE = "college_level_undergraduate"
    ASSOCIATE_DEGREE = "associate_degree"
    BACHELORS_DEGREE = "bachelors_degree"
    MASTERS_DEGREE = "masters_degree"
    DOCTORATE_DEGREE = "doctorate_degree"


class User(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    email: str
    password: str
    onboarding_completed: bool = False
    onboarding_completed_at: datetime | None = None
    accepted_terms: bool = False
    accepted_terms_at: datetime | None = None
    accepted_privacy_policy: bool = False
    accepted_privacy_policy_at: datetime | None = None
    status: UserStatus = UserStatus.ACTIVE
    deleted_at: datetime | None = None
    model_config = {"from_attributes": True}


class PublicUser(BaseModel):
    id: uuid.UUID
    email: str
    status: UserStatus

    model_config = {"from_attributes": True}


class UserProfile(BaseModel):
    user_id: uuid.UUID
    email: str | None = None
    alias: str
    first_name: str
    last_name: str
    image_file_id: str | None = None
    age_group: AgeGroup
    gender: Gender
    occupation: str | None = None
    education_level: EducationLevel
    bio: str | None = None
    preferences: dict | None = None

    model_config = {"from_attributes": True}


class UserSecurity(BaseModel):
    user_id: uuid.UUID
    email_verified: bool = False
    email_verified_at: datetime | None = None
    password_change_at: datetime | None = None
    failed_login_attempts: int = 0
    locked_until: datetime | None = None

    model_config = {"from_attributes": True}


class UserActivity(BaseModel):
    user_id: uuid.UUID
    last_login_at: datetime | None = None
    last_activity_at: datetime | None = None
    login_count: int = 0

    model_config = {"from_attributes": True}
