import re
import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender

_ALIAS_RE = re.compile(r"^[a-z0-9_]+$")


class UserOnboardingRequest(BaseModel):
    alias: str = Field(min_length=3, max_length=100)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    age_group: AgeGroup
    gender: Gender
    education_level: EducationLevel
    occupation: str | None = Field(default=None, max_length=150)
    bio: str | None = Field(default=None, max_length=500)

    @field_validator("alias")
    @classmethod
    def alias_valid(cls, v: str) -> str:
        lowered = v.lower()
        if not _ALIAS_RE.match(lowered):
            raise ValueError("Alias may only contain lowercase letters, numbers, and underscores")
        return lowered


class UserOnboardingResponse(BaseModel):
    success: bool = True
    user_id: uuid.UUID
    alias: str
    first_name: str
    last_name: str
    age_group: AgeGroup
    gender: Gender
    education_level: EducationLevel
    occupation: str | None = None
    bio: str | None = None
    message: str = "Onboarding completed successfully."
    access_token: str


class CheckAliasResponse(BaseModel):
    success: bool = True
    alias: str
    available: bool


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class ChangePasswordResponse(BaseModel):
    success: bool = True
    message: str = "Password changed successfully. All active sessions have been invalidated."


class DeleteAccountRequest(BaseModel):
    current_password: str = Field(min_length=1)
    reason: str | None = Field(default=None, min_length=1, max_length=500)


class AdminDeleteAccountRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


class DeleteAccountResponse(BaseModel):
    success: bool = True
    user_id: uuid.UUID
    deletion_requested_at: datetime
    deletion_scheduled_for: datetime
    requested_by: uuid.UUID
    grace_period_days: int = 30
    message: str = "Account deletion scheduled. The account will be permanently deleted after the 30-day grace period unless the user logs in before then."


class LoginHistoryEntryResponse(BaseModel):
    id: uuid.UUID
    ip_address: str | None = None
    user_agent: str | None = None
    browser: str | None = None
    os: str | None = None
    device_type: str | None = None
    city: str | None = None
    region: str | None = None
    country: str | None = None
    successful: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginHistoryListResponse(BaseModel):
    success: bool = True
    data: list[LoginHistoryEntryResponse]
