import logging

from arq.connections import ArqRedis
from sqlalchemy import text

from app.infrastructure.database.session import engine


def _get_logger() -> logging.Logger:
    uvicorn = logging.getLogger("uvicorn.error")
    return uvicorn if uvicorn.handlers else logging.getLogger(__name__)


logger = _get_logger()


async def verify_connections(arq: ArqRedis) -> None:
    await arq.ping()
    logger.info("ARQ Redis connected successfully")

    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))

    url = engine.url
    logger.info(
        "PostgreSQL connected — host=%s port=%s db=%s",
        url.host,
        url.port,
        url.database,
    )
