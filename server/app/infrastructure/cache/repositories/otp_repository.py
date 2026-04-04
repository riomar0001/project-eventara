"""Redis-backed one-time passcode (OTP) repository.

Storing OTPs in Redis instead of PostgreSQL provides three advantages:

1. **Auto-expiry** — Redis TTL handles code expiration without cron jobs or
   manual cleanup queries.
2. **Atomic consume** — ``GETDEL`` retrieves and deletes the hash in a single
   round-trip, making it impossible for two concurrent verification requests
   to both succeed with the same code.
3. **Speed** — OTP look-ups are in-memory, not a DB query.

Key schema:  ``otp:{user_id}``
Value:       bcrypt hash of the plaintext OTP (plaintext is never stored)
TTL:         ``OTP_TTL_MINUTES * 60`` seconds — set atomically on creation
"""

import uuid

from redis.asyncio import Redis

from app.core.security.constants import OTP_TTL_MINUTES
from app.core.security.hashing import generate_otp, hash_string, verify_hash


def _key(user_id: uuid.UUID) -> str:
    return f"otp:{user_id}"


class OTPRepository:
    """Manages one-time passcodes backed by Redis.

    Each user holds at most one active OTP at any time — generating a new
    code unconditionally overwrites the previous one via ``SET``, which is
    atomic.
    """

    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    async def create_for_user(self, user_id: uuid.UUID) -> str:
        """Generate a new OTP, store its hash in Redis, and return the plaintext code.

        Any previously active OTP for the same user is overwritten atomically
        by the ``SET`` command, so at most one valid code exists per user at
        any point in time.

        Args:
            user_id: The user the OTP belongs to.

        Returns:
            The plaintext 6-digit code to be delivered to the user.
            Only the bcrypt hash is persisted — the plaintext is never stored.
        """
        code = generate_otp()
        await self.redis.set(
            _key(user_id),
            hash_string(code),
            ex=OTP_TTL_MINUTES * 60,
        )
        return code

    async def verify_and_consume(self, user_id: uuid.UUID, code: str) -> bool:
        """Verify the supplied code and, if correct, consume (delete) it atomically.

        Uses ``GETDEL`` so the hash is removed from Redis in the same
        round-trip that retrieves it.  This guarantees a code can only be
        verified once even if two requests arrive simultaneously — the second
        caller receives ``None`` from ``GETDEL`` and fails immediately.

        Args:
            user_id: The user whose OTP is being verified.
            code:    The plaintext code submitted by the user.

        Returns:
            ``True`` if the code matched and was consumed, ``False`` if the
            code was not found (expired or already used) or did not match.
        """
        stored_hash: str | None = await self.redis.getdel(_key(user_id))

        if stored_hash is None:
            return False

        return verify_hash(code, stored_hash)

    async def delete_for_user(self, user_id: uuid.UUID) -> None:
        """Delete the OTP for a user, e.g. when they request a fresh code."""
        await self.redis.delete(_key(user_id))
