import uuid
from dataclasses import dataclass

from app.domain.entities.user import User, UserActivity, UserProfile, UserSecurity, UserStatus
from app.domain.exceptions import EmailAlreadyTakenError
from app.domain.interfaces.user_repository import IUserRepository
from app.infrastructure.security.hashing import hash_string, verify_hash


@dataclass
class RegisterUserInput:
    email: str
    password: str
    alias: str
    first_name: str
    last_name: str
    age_group: str
    gender: str
    education_level: str
    occupation: str | None = None
    bio: str | None = None


@dataclass
class LoginUserInput:
    email: str
    password: str


class UserUseCase:
    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def register(self, data: RegisterUserInput) -> User:
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise EmailAlreadyTakenError(data.email)

        user_id = uuid.uuid4()

        user = User(id=user_id, email=data.email, password=hash_string(data.password))
        security = UserSecurity(user_id=user_id)
        activity = UserActivity(user_id=user_id)
        profile = UserProfile(
            user_id=user_id,
            email=data.email,
            alias=data.alias,
            first_name=data.first_name,
            last_name=data.last_name,
            age_group=data.age_group,
            gender=data.gender,
            education_level=data.education_level,
            occupation=data.occupation,
            bio=data.bio,
        )

        return await self.repo.create(user, security, activity, profile)

    async def login(self, data: LoginUserInput) -> User | None:
        user = await self.repo.get_by_email(data.email)
        if not user:
            return None

        if not verify_hash(data.password, user.password):
            return None

        return user
