import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.user import (
    User as DomainUser,
    UserActivity as DomainUserActivity,
    UserProfile as DomainUserProfile,
    UserSecurity as DomainUserSecurity,
    UserStatus,
)
from app.infrastructure.database.models.user import (
    User,
    UserActivity,
    UserProfile,
    UserSecurity,
)


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> DomainUser | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile), selectinload(User.security))
            .where(User.email == email)
        )
        orm_user = result.scalar_one_or_none()
        return _to_domain(orm_user)

    async def get_by_id(self, user_id: uuid.UUID) -> DomainUser | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        orm_user = result.scalar_one_or_none()
        return _to_domain(orm_user)

    async def get_by_id_with_profile(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile), selectinload(User.security))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def update_email_verified(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            update(UserSecurity)
            .where(UserSecurity.user_id == user_id)
            .values(email_verified=True, email_verified_at=datetime.now(timezone.utc))
        )
        await self.db.commit()

    async def create(
        self,
        user: DomainUser,
        security: DomainUserSecurity,
        activity: DomainUserActivity,
        profile: DomainUserProfile,
    ) -> DomainUser:
        orm_user = User(id=user.id, email=user.email, password=user.password, status=user.status)
        orm_security = UserSecurity(user_id=security.user_id)
        orm_activity = UserActivity(user_id=activity.user_id)
        orm_profile = UserProfile(
            user_id=profile.user_id,
            alias=profile.alias,
            first_name=profile.first_name,
            last_name=profile.last_name,
            age_group=profile.age_group,
            gender=profile.gender,
            education_level=profile.education_level,
            occupation=profile.occupation,
            bio=profile.bio,
        )
        self.db.add_all([orm_user, orm_security, orm_activity, orm_profile])
        await self.db.commit()
        await self.db.refresh(orm_user)
        return DomainUser(
            id=orm_user.id,
            email=orm_user.email,
            password=orm_user.password,
            status=orm_user.status if isinstance(orm_user.status, UserStatus) else UserStatus(orm_user.status),
        )


def _to_domain(orm_user: User | None) -> DomainUser | None:
    if orm_user is None:
        return None
    return DomainUser(
        id=orm_user.id,
        email=orm_user.email,
        password=orm_user.password,
        status=orm_user.status if isinstance(orm_user.status, UserStatus) else UserStatus(orm_user.status),
    )
