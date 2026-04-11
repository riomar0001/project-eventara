from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession]:
    """FastAPI dependency that provides a request-scoped async database session.

    ``expire_on_commit=False`` is set on the session factory so ORM objects
    remain accessible after a commit without triggering implicit lazy-loads —
    important in async contexts where lazy loading is not supported.
    """
    async with AsyncSessionLocal() as session:
        yield session
