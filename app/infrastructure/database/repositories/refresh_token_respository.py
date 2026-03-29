import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.token import Token


class RefreshTokenRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, token: Token) -> Token:
        self.db.add(token)
        await self.db.commit()
        await self.db.refresh(token)
        return token

    async def get_by_id(self, token_id: uuid.UUID) -> Token | None:
        result = await self.db.execute(
            select(Token).where(Token.id == token_id)
        )
        return result.scalar_one_or_none()

    async def get_active_by_id(self, token_id: uuid.UUID) -> Token | None:
        result = await self.db.execute(
            select(Token).where(Token.id == token_id, Token.is_active == True)
        )
        return result.scalar_one_or_none()

    async def get_active_tokens_for_user(self, user_id: uuid.UUID) -> list[Token]:
        result = await self.db.execute(
            select(Token).where(Token.user_id == user_id, Token.is_active == True)
        )
        return list(result.scalars().all())

    async def revoke(self, token: Token) -> None:
        token.is_active = False
        token.revoked_at = datetime.now(timezone.utc)
        await self.db.commit()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> int:
        """Revoke all active tokens for a user. Returns the number of tokens revoked."""
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            update(Token)
            .where(Token.user_id == user_id, Token.is_active == True)
            .values(is_active=False, revoked_at=now)
        )
        await self.db.commit()
        return result.rowcount

    async def update_last_used(self, token: Token) -> None:
        token.last_used_at = datetime.now(timezone.utc)
        await self.db.commit()
