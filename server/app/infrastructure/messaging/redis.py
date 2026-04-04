from arq import create_pool
from arq.connections import ArqRedis, RedisSettings
from redis.asyncio import Redis

from app.core.config import settings


def get_redis_settings() -> RedisSettings:
    return RedisSettings(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        username=settings.REDIS_USERNAME or None,
        password=settings.REDIS_PASSWORD or None,
    )


async def create_arq_pool() -> ArqRedis:
    """Create the ARQ job-queue connection pool."""
    return await create_pool(get_redis_settings())


async def create_redis_client() -> Redis:
    """Create a direct async Redis client for general-purpose use (e.g. rate limiting).

    Separate from the ARQ pool so job-queue and application traffic do not
    share the same connection resources.
    """
    return Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        username=settings.REDIS_USERNAME or None,
        password=settings.REDIS_PASSWORD or None,
        decode_responses=True,
    )
