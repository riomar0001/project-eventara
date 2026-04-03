import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.user import UserOneTimeCode


class OneTimeCodeRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, otc: UserOneTimeCode) -> UserOneTimeCode:
        self.db.add(otc)
        await self.db.commit()
        await self.db.refresh(otc)
        return otc

    async def get_active_by_user(self, user_id: uuid.UUID) -> UserOneTimeCode | None:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(UserOneTimeCode).where(
                UserOneTimeCode.user_id == user_id,
                UserOneTimeCode.expires_at > now,
                UserOneTimeCode.used_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def mark_used(self, otc: UserOneTimeCode) -> None:
        otc.used_at = datetime.now(timezone.utc)
        await self.db.commit()

    async def delete_for_user(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(UserOneTimeCode).where(UserOneTimeCode.user_id == user_id)
        )
        await self.db.commit()
