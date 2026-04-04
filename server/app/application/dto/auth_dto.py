from dataclasses import dataclass

from app.domain.entities.user_entity import PublicUser


@dataclass
class RegisterUserInput:
    email: str
    password: str


@dataclass
class LoginUserInput:
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
class LoginOutput:
    """Output produced by a successful login.

    Attributes:
        access_token: Short-lived JWT used to authenticate API requests.
        refresh_token: Long-lived opaque token stored in DB; used to
            obtain new access tokens without re-entering credentials.
    """

    access_token: str
    refresh_token: str
