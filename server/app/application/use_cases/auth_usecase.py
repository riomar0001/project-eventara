from typing import Dict
import uuid
from dataclasses import dataclass

from app.domain.entities.user_entity import PublicUser, User, UserActivity, UserProfile, UserSecurity, AgeGroup, Gender, EducationLevel
from app.domain.exceptions import EmailAlreadyTakenError
from app.application.interfaces.user_interface import IUserRepository
from app.infrastructure.repositories.user_repository import UserRepository
from app.core.security.hashing import hash_string, verify_hash
from app.core.security.token_service import verification_token

from app.infrastructure.messaging.email import otp_email_html, send_email, verification_email_html

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


class AuthUseCase:
    def __init__(self, repo: IUserRepository, ) -> None:
        self.repo = repo

    async def register(self, data: RegisterUserInput) -> RegisteredUserOutput:
        existing = await self.repo.get_by_email(data.email)

        if existing:
            raise EmailAlreadyTakenError(data.email)

        user_id = uuid.uuid4()

        user = User(email=data.email, password=hash_string(data.password))
        security = UserSecurity(user_id=user_id)
        activity = UserActivity(user_id=user_id)
        
        new_user = await self.repo.create(user, security, activity)
        
        verify_token = verification_token(user_id, data.email)   
        
        await send_email(
            to=user.email,
            subject="Verify your Eventara email",
            html=verification_email_html(verify_token),
        )
        
        return RegisteredUserOutput(
            user=PublicUser.model_validate(new_user),
            verification_token=verify_token
        )

    async def login(self, data: LoginUserInput) -> User | None:
        user = await self.repo.get_by_email(data.email)
        if not user:
            return None

        if not verify_hash(data.password, user.password):
            return None

        return user
