from arq import create_pool
from arq.connections import ArqRedis, RedisSettings

from app.config import settings


def get_redis_settings() -> RedisSettings:
    return RedisSettings(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        username=settings.REDIS_USERNAME or None,
        password=settings.REDIS_PASSWORD or None,
    )


async def create_arq_pool() -> ArqRedis:
    return await create_pool(get_redis_settings())
