"""SQL implementation of the app feedback repository."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.app_feedback_entity import AppFeedback as AppFeedbackEntity
from app.domain.entities.dashboard_entity import UserRegistrationWeek
from app.infrastructure.database.models.app_feedback_models import AppFeedback
from app.infrastructure.database.models.user_models import User


class AppFeedbackRepository:
    """Concrete SQL repository for anonymous app feedback records and user registration analytics.

    Write operations flush within the caller's transaction; ``db.commit()`` is
    never called here so the use-case layer owns the transaction lifecycle.
    Read operations issue pure SELECT queries with no locks or side effects.

    The ``get_users_per_week`` query groups by ``date_trunc('week', created_at)``
    which follows PostgreSQL ISO week semantics (Monday at 00:00 UTC as the
    week boundary).

    Args:
        db: SQLAlchemy AsyncSession provided by the request-scoped dependency.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, rating: int, comment: str | None, ip_address: str | None) -> AppFeedbackEntity:
        """Insert a new feedback record and flush within the current transaction."""
        record = AppFeedback(rating=rating, comment=comment, ip_address=ip_address)
        self.db.add(record)
        await self.db.flush()
        return self._to_entity(record)

    async def get_paginated(self, page: int, page_size: int) -> tuple[list[AppFeedbackEntity], int]:
        """Return one page of feedback records ordered newest-first, plus the total count."""
        offset = (page - 1) * page_size

        stmt = select(AppFeedback).order_by(AppFeedback.created_at.desc()).offset(offset).limit(page_size)
        result = await self.db.execute(stmt)
        records = result.scalars().all()

        count_stmt = select(func.count(AppFeedback.id))
        total: int = (await self.db.execute(count_stmt)).scalar_one()

        return [self._to_entity(r) for r in records], total

    async def get_users_per_week(self, weeks: int) -> list[UserRegistrationWeek]:
        """Return weekly non-deleted user registration counts for the last N ISO weeks."""
        earliest = datetime.now(timezone.utc) - timedelta(weeks=weeks)
        stmt = (
            select(
                func.date_trunc("week", User.created_at).label("week_start"),
                func.count(User.id).label("count"),
            )
            .where(User.created_at >= earliest, User.deleted_at.is_(None))
            .group_by(func.date_trunc("week", User.created_at))
            .order_by(func.date_trunc("week", User.created_at).asc())
        )
        result = await self.db.execute(stmt)
        return [
            UserRegistrationWeek(
                week_start=row.week_start,
                week_end=row.week_start + timedelta(days=6, hours=23, minutes=59, seconds=59),
                count=row.count,
            )
            for row in result.all()
        ]

    @staticmethod
    def _to_entity(record: AppFeedback) -> AppFeedbackEntity:
        return AppFeedbackEntity(
            id=record.id,
            rating=record.rating,
            comment=record.comment,
            ip_address=record.ip_address,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )
