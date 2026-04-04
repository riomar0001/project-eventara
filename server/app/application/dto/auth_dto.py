import uuid
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
