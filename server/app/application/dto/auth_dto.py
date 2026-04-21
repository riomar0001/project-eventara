import uuid
from dataclasses import dataclass

from app.domain.entities.user_entity import PublicUser


@dataclass
class RegisterUserInput:
    email: str
    password: str
    accepted_terms: bool
    accepted_privacy_policy: bool


@dataclass
class RegisteredUserOutput:
    user: PublicUser
    verification_token: str


@dataclass
class VerifiedEmailOutput:
    access_token: str
    refresh_token: str


@dataclass
class LoginInput:
    email: str
    password: str


@dataclass
class LoginOutput:
    verification_token: str
    otp: str | None = None


@dataclass
class LoginVerifyInput:
    token: str
    code: str
    ip_address: str | None = None
    user_agent: str | None = None


@dataclass
class LoginVerifyOutput:
    access_token: str
    refresh_token: str
    user_id: uuid.UUID | None = None


@dataclass
class LogoutInput:
    refresh_token: str


@dataclass
class RefreshTokenInput:
    refresh_token: str


@dataclass
class RefreshTokenOutput:
    access_token: str
    refresh_token: str


@dataclass
class ResendOtpInput:
    token: str


@dataclass
class ResendOtpOutput:
    verification_token: str
    otp: str | None = None


@dataclass
class ResendVerificationInput:
    email: str


@dataclass
class ForgotPasswordInput:
    email: str


@dataclass
class ResetPasswordInput:
    token: str
    new_password: str
