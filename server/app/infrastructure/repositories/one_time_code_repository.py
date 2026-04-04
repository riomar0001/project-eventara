import uuid
from datetime import datetime, timedelta, timezone

from typing import cast

from sqlalchemy import delete, select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.user_models import UserOneTimeCode
from app.core.security.constants import OTP_TTL_MINUTES
from app.core.security.hashing import generate_otp, hash_string


class OneTimeCodeRepository:
    """Manages one-time passcodes (OTPs) used for step-up authentication flows.

    Each user may have at most one active OTP at a time; creating a new code
    automatically deletes any previous one for the same user.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_for_user(self, user_id: uuid.UUID) -> str:
        """Delete any existing OTP for the user, then generate, hash, and store a new one.

        Returns:
            The plaintext OTP to be delivered to the user (e.g. via email/SMS).
            Only the bcrypt hash is persisted; the plaintext is never stored.
        """
        await self.delete_for_user(user_id)
        code = generate_otp()
        otc = UserOneTimeCode(
            user_id=user_id,
            code_hash=hash_string(code),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES),
        )
        self.db.add(otc)
        await self.db.commit()
        return code

    async def create(self, otc: UserOneTimeCode) -> UserOneTimeCode:
        """Persist a pre-built OTP record and return it with DB-generated fields populated."""
        self.db.add(otc)
        await self.db.commit()
        await self.db.refresh(otc)
        return otc

    async def get_active_by_user(self, user_id: uuid.UUID) -> UserOneTimeCode | None:
        """Return the user's current unexpired, unused OTP record, or None if none exists."""
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(UserOneTimeCode).where(
                UserOneTimeCode.user_id == user_id,
                UserOneTimeCode.expires_at > now,
                UserOneTimeCode.used_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def mark_used(self, otc: UserOneTimeCode) -> bool:
        """Atomically mark the code as used. Returns False if already used."""
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            update(UserOneTimeCode)
            .where(
                UserOneTimeCode.id == otc.id,
                UserOneTimeCode.used_at.is_(None),
            )
            .values(used_at=now)
        )
        await self.db.commit()
        return cast(CursorResult, result).rowcount > 0

    async def delete_for_user(self, user_id: uuid.UUID) -> None:
        """Delete all OTP records for a user regardless of expiry or used status."""
        await self.db.execute(
            delete(UserOneTimeCode).where(UserOneTimeCode.user_id == user_id)
        )
        await self.db.commit()
