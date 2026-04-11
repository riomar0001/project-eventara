import uuid

from pydantic import BaseModel, EmailStr, Field


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
    verification_token: str | None = Field(default=None, description="Only included in DEBUG mode")

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
    token: str = Field(min_length=1)
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class LoginVerifyResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    message: str = "Login verified successfully."


class LogoutRequest(BaseModel):
    refresh_token: str


class LogoutResponse(BaseModel):
    success: bool = True
    message: str = "Logged out successfully."


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    message: str = "Token refreshed successfully."


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    success: bool = True
    message: str = "If that email address is in our system and unverified, a new confirmation link has been sent."


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    success: bool = True
    message: str = "If that email address is in our system, you will receive a password reset link shortly."


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=8)


class ResetPasswordResponse(BaseModel):
    success: bool = True
    message: str = "Password has been reset successfully."
