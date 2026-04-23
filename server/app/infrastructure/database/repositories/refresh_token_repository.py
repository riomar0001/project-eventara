import uuid
from datetime import UTC, datetime
from typing import cast

from sqlalchemy import select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.user_models import Token


class RefreshTokenRepository:
    """Manages long-lived refresh tokens used to obtain new access tokens.

    Tokens are stored as bcrypt hashes; the plaintext is never persisted.
    A token is considered valid only when ``is_active=True`` and ``expires_at``
    is in the future.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _utcnow_naive() -> datetime:
        """Return UTC now as a naive datetime for TIMESTAMP WITHOUT TIME ZONE columns."""
        return datetime.now(UTC).replace(tzinfo=None)

    async def create(self, token: Token) -> Token:
        """Persist a new refresh token record and return it with DB fields populated."""
        self.db.add(token)
        await self.db.commit()
        await self.db.refresh(token)
        return token

    async def get_by_id(self, token_id: uuid.UUID) -> Token | None:
        """Return the token record matching ``token_id``, or None if not found."""
        result = await self.db.execute(select(Token).where(Token.id == token_id))
        return result.scalar_one_or_none()

    async def get_active_by_id(self, token_id: uuid.UUID) -> Token | None:
        """Return the token only if it exists and has not been revoked."""
        result = await self.db.execute(select(Token).where(Token.id == token_id, Token.is_active.is_(True)))
        return result.scalar_one_or_none()

    async def get_active_tokens_for_user(self, user_id: uuid.UUID) -> list[Token]:
        """Return all non-revoked tokens belonging to a user."""
        result = await self.db.execute(select(Token).where(Token.user_id == user_id, Token.is_active.is_(True)))
        return list(result.scalars().all())

    async def revoke(self, token: Token) -> bool:
        """Atomically revoke a token. Returns False if already revoked."""
        now = self._utcnow_naive()
        result = await self.db.execute(update(Token).where(Token.id == token.id, Token.is_active.is_(True)).values(is_active=False, revoked_at=now))
        await self.db.commit()
        return cast("CursorResult", result).rowcount > 0

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> int:
        """Revoke all active tokens for a user. Returns the number of tokens revoked."""
        now = self._utcnow_naive()
        result = await self.db.execute(
            update(Token).where(Token.user_id == user_id, Token.is_active.is_(True)).values(is_active=False, revoked_at=now)
        )
        await self.db.commit()
        return cast("CursorResult", result).rowcount

    async def stage_revoke_all_for_user(self, user_id: uuid.UUID) -> int:
        """Stage revocation of all active tokens for a user within the current transaction.

        This variant mirrors ``revoke_all_for_user`` but leaves transaction finalization
        to the caller so security-sensitive account mutations can commit user state and
        token invalidation atomically.
        """
        now = self._utcnow_naive()
        result = await self.db.execute(
            update(Token).where(Token.user_id == user_id, Token.is_active.is_(True)).values(is_active=False, revoked_at=now)
        )
        await self.db.flush()
        return cast("CursorResult", result).rowcount

    async def revoke_expired(self) -> int:
        """Atomically revoke all active tokens whose expiry time has passed.

        Executes a single bulk ``UPDATE … WHERE is_active = TRUE AND expires_at < now``
        so the operation is safe to run concurrently — if two workers overlap,
        the second will simply match zero rows and commit a no-op.

        Returns:
            The number of tokens that were revoked.
        """
        now = self._utcnow_naive()
        result = await self.db.execute(update(Token).where(Token.is_active.is_(True), Token.expires_at < now).values(is_active=False, revoked_at=now))
        await self.db.commit()
        return cast("CursorResult", result).rowcount

    async def update_last_used(self, token: Token) -> None:
        """Stamp ``last_used_at`` on the token record for audit purposes."""
        now = self._utcnow_naive()
        await self.db.execute(update(Token).where(Token.id == token.id).values(last_used_at=now))
        await self.db.commit()
