import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.models.user import User, UserActivity, UserProfile, UserSecurity


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile), selectinload(User.security))
            .where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

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
        user: User,
        security: UserSecurity,
        activity: UserActivity,
        profile: UserProfile,
    ) -> User:
        self.db.add_all([user, security, activity, profile])
        await self.db.commit()
        await self.db.refresh(user)
        return user
