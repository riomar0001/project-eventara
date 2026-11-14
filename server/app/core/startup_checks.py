import logging

from redis.asyncio import Redis
from sqlalchemy import text

from app.infrastructure.database.session import engine


def _get_logger() -> logging.Logger:
    uvicorn = logging.getLogger("uvicorn.error")
    return uvicorn if uvicorn.handlers else logging.getLogger(__name__)


logger = _get_logger()


async def verify_connections(redis: Redis) -> None:
    await redis.ping()
    logger.info("Redis connected successfully")

    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))

    url = engine.url
    logger.info(
        "PostgreSQL connected — host=%s port=%s db=%s",
        url.host,
        url.port,
        url.database,
    )
