from dataclasses import dataclass

from app.domain.entities.user_entity import PublicUser


@dataclass
class RegisterUserInput:
    email: str
    password: str


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


@dataclass
class LoginVerifyInput:
    token: str
    code: str


@dataclass
class LoginVerifyOutput:
    access_token: str
    refresh_token: str


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
class ResendVerificationInput:
    email: str


@dataclass
class ForgotPasswordInput:
    email: str


@dataclass
class ResetPasswordInput:
    token: str
    new_password: str
