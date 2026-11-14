from redis.asyncio import Redis

from app.core.config import settings


async def create_redis_client() -> Redis:
    """Create the async Redis client used for rate limits, OTPs, reset tokens and dead jobs."""
    return Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        username=settings.REDIS_USERNAME or None,
        password=settings.REDIS_PASSWORD or None,
        ssl=settings.REDIS_SSL,
        decode_responses=True,
        socket_timeout=5,
        socket_connect_timeout=5,
    )
