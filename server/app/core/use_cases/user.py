import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmailAlreadyTakenError
from app.core.hash_utils import hash_string
from app.infrastructure.database.models.user import User, UserActivity, UserProfile, UserSecurity
from app.infrastructure.database.repositories.user_repository import UserRepository


class RegisterUserInput:
    def __init__(
        self,
        email: str,
        password: str,
        role: str,
        alias: str,
        first_name: str,
        last_name: str,
        age_group: str,
        gender: str,
        education_level: str,
        occupation: str | None = None,
        bio: str | None = None,
    ) -> None:
        self.email = email
        self.password = password
        self.role = role
        self.alias = alias
        self.first_name = first_name
        self.last_name = last_name
        self.age_group = age_group
        self.gender = gender
        self.education_level = education_level
        self.occupation = occupation
        self.bio = bio


class LoginUserInput:
    def __init__(self, email: str, password: str) -> None:
        self.email = email
        self.password = password


async def register_user(data: RegisterUserInput, db: AsyncSession) -> User:
    repo = UserRepository(db)

    existing = await repo.get_by_email(data.email)
    if existing:
        raise EmailAlreadyTakenError(
            f"Email '{data.email}' is already registered")

    user_id = uuid.uuid4()

    user = User(
        id=user_id,
        email=data.email,
        password=hash_string(data.password),
        role=data.role,
    )
    security = UserSecurity(user_id=user_id)
    activity = UserActivity(user_id=user_id)
    profile = UserProfile(
        user_id=user_id,
        alias=data.alias,
        first_name=data.first_name,
        last_name=data.last_name,
        age_group=data.age_group,
        gender=data.gender,
        education_level=data.education_level,
        occupation=data.occupation,
        bio=data.bio,
    )

    return await repo.create(user, security, activity, profile)


async def login_user(data: LoginUserInput, db: AsyncSession) -> User:
    repo = UserRepository(db)

    user = await repo.get_by_email(data.email)
    if not user:
        return None

    if user.password != hash_string(data.password):
        return None
    
    return user
