import uuid
from pydantic import BaseModel, EmailStr, field_validator, Field

from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender



class ErrorResponse(BaseModel):
    success: bool = False
    message: str


class ValidationErrorResponse(BaseModel):
    success: bool = False
    detail: list


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class RegisterResponse(BaseModel):
    success: bool = True
    user_id: uuid.UUID
    email: str
    message: str = "Registration successful. Please verify your email."
    verification_token: str | None = Field(
        default=None,
        description="Only included in DEBUG mode"
    )

    class Config:
        from_attributes = True


class VerifyEmailResponse(BaseModel):
    success: bool = True
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    message: str = "Email verified successfully."


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    message: str = "Login successful."


class LoginInitResponse(BaseModel):
    success: bool = True
    verification_token: str
    message: str = "OTP sent to your email."


class LoginVerifyRequest(BaseModel):
    token: str
    code: str


class LogoutRequest(BaseModel):
    refresh_token: str


class LogoutResponse(BaseModel):
    success: bool = True
    message: str = "Logged out successfully."
