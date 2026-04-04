"""Redis-backed rate limit repository.

Uses a fixed-window counter: each key tracks the number of hits within a
rolling window whose duration is set on the first hit via ``EXPIRE … NX``.
The ``NX`` flag ensures the TTL is only written once per window so subsequent
increments do not reset the clock.
"""

from redis.asyncio import Redis


class RateLimitRepository:
    """Atomic fixed-window counter backed by Redis.

    Each window is identified by a caller-supplied key.  The counter increments
    on every ``hit`` call and expires automatically after ``window_seconds``.
    """

    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    async def hit(self, key: str, window_seconds: int) -> int:
        """Increment the counter for ``key`` and return the new count.

        The expiry is set only on the first hit of each window (``EXPIRE … NX``)
        so the window boundary is fixed at the time of the first request, not
        extended by subsequent ones.

        Both commands are sent in a single pipeline to minimise round-trips.

        Args:
            key:            Redis key identifying the rate-limit bucket.
            window_seconds: Length of the fixed window in seconds.

        Returns:
            The updated hit count after this request.
        """
        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.incr(key)
            # NX: only set expiry if the key has no TTL yet (i.e. first hit)
            pipe.expire(key, window_seconds, nx=True)
            results = await pipe.execute()
        return int(results[0])

    async def get_ttl(self, key: str) -> int:
        """Return the remaining window time in seconds, or 0 if the key is absent."""
        ttl = await self.redis.ttl(key)
        return max(int(ttl), 0)

    async def reset(self, key: str) -> None:
        """Delete the counter, e.g. after a successful login to clear the bucket."""
        await self.redis.delete(key)
