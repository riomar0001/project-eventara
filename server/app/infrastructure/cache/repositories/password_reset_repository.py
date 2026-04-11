"""Redis-backed single-use password reset token store.

Password reset tokens are stored in Redis rather than PostgreSQL for the same
reasons as OTPs: automatic expiry via TTL, in-memory speed, and an atomic
``GETDEL`` consume operation.  Unlike OTPs, the stored value is the SHA-256
hash of the full JWT (not a bcrypt hash) because the token is long, structured
data — bcrypt is capped at 72 bytes and is intentionally slow, making it wrong
for hashing JWTs.  SHA-256 has no length limit and is fast enough for
single-use lookups while remaining a one-way function.

Key schema:  ``pwd_reset:{user_id}``
Value:       SHA-256 hex digest of the plaintext JWT
TTL:         ``PASSWORD_RESET_TOKEN_EXPIRATION`` seconds — set atomically on creation

Concurrency:
    ``store`` uses Redis ``SET``, which atomically overwrites any previously
    pending reset token.  At most one valid token exists per user at any time,
    so a second forgot-password request immediately invalidates the first link
    that was emailed.

    ``verify_and_consume`` uses ``GETDEL``, which atomically retrieves and
    deletes the stored hash in a single round-trip.  If two reset requests
    arrive simultaneously for the same token only one can receive the hash;
    the other gets ``None`` and is rejected without any additional locking.
"""

import uuid

from redis.asyncio import Redis

from app.core.security.hashing import hash_token, verify_token_hash

_KEY_PREFIX = "pwd_reset"
_TTL_SECONDS = 3600


class PasswordResetRepository:
    """Manages single-use password reset tokens backed by Redis.

    Each user holds at most one active reset token at any time.  Issuing a
    new token atomically replaces any existing one via ``SET``.
    """

    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    def _key(self, user_id: uuid.UUID) -> str:
        return f"{_KEY_PREFIX}:{user_id}"

    async def store(self, user_id: uuid.UUID, token: str) -> None:
        """Hash and store a password reset token for the given user.

        Any previously stored token is atomically replaced, ensuring at most
        one valid reset request exists per user at any time.

        Args:
            user_id: The user requesting a password reset.
            token:   The plaintext JWT to hash and persist.
        """
        await self.redis.set(self._key(user_id), hash_token(token), ex=_TTL_SECONDS)

    async def verify_and_consume(self, user_id: uuid.UUID, token: str) -> bool:
        """Atomically retrieve, delete, and verify the stored reset token hash.

        Uses ``GETDEL`` so the stored hash is removed regardless of whether
        verification passes, making replay attacks impossible.

        Args:
            user_id: The user whose reset token is being consumed.
            token:   The plaintext JWT submitted by the client.

        Returns:
            ``True`` if the stored hash matched the submitted token,
            ``False`` if no token exists for the user or the hash does not match.
        """
        stored_hash: bytes | str | None = await self.redis.getdel(self._key(user_id))

        if stored_hash is None:
            return False

        if isinstance(stored_hash, bytes):
            stored_str = stored_hash.decode()
        else:
            stored_str = str(stored_hash)
        return verify_token_hash(token, stored_str)

    async def delete(self, user_id: uuid.UUID) -> None:
        """Remove a pending reset token for the given user, if any."""
        await self.redis.delete(self._key(user_id))
