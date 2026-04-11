import uuid

from pydantic import BaseModel, Field, field_validator

from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender


class UserOnboardingRequest(BaseModel):
    alias: str = Field(min_length=3, max_length=100)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    age_group: AgeGroup
    gender: Gender
    education_level: EducationLevel
    occupation: str | None = Field(default=None, max_length=150)
    bio: str | None = None

    @field_validator("alias")
    @classmethod
    def alias_no_spaces(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Alias must not contain spaces")
        return v.lower()


class UserOnboardingResponse(BaseModel):
    success: bool = True
    user_id: uuid.UUID
    alias: str
    first_name: str
    last_name: str
    message: str = "Onboarding completed successfully."


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class ChangePasswordResponse(BaseModel):
    success: bool = True
    message: str = "Password changed successfully. All active sessions have been invalidated."
