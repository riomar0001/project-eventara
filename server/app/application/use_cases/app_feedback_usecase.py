"""Use cases for anonymous application feedback and weekly user registration metrics."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.app_feedback_dto import (
    GetAppFeedbackInput,
    GetAppFeedbackOutput,
    GetUsersPerWeekInput,
    GetUsersPerWeekOutput,
    SubmitAppFeedbackInput,
    SubmitAppFeedbackOutput,
)
from app.application.interfaces.app_feedback_interface import IAppFeedbackRepository


class AppFeedbackUseCase:
    """Application service for submitting and retrieving anonymous app feedback.

    Anonymous feedback carries no user-identity constraint — the only
    uniqueness invariant is the IP-based fixed-window rate limit enforced at the
    controller layer before the use case is invoked.  Each INSERT is therefore an
    unconditional atomic write; no pessimistic locking or uniqueness pre-check is
    required in the use case.

    Concurrency strategy: the Redis INCR+EXPIRE NX pipeline in the controller
    dependency is the serialisation point for concurrent submissions from a single
    IP.  Once a request passes the counter gate the DB INSERT cannot produce a
    constraint violation — no uniqueness index exists on anonymous records.
    SQLAlchemy autoflush + commit provides ACID guarantees for each write.

    Args:
        repository: Concrete implementation of IAppFeedbackRepository.
        db:         Active async database session owned by the use case for
                    commit/rollback lifecycle management.
    """

    MAX_PAGE_SIZE = 100

    def __init__(self, repository: IAppFeedbackRepository, db: AsyncSession) -> None:
        self.repository = repository
        self.db = db

    async def submit_feedback(self, data: SubmitAppFeedbackInput) -> SubmitAppFeedbackOutput:
        """Persist a single anonymous feedback record and commit the transaction.

        Args:
            data: ``SubmitAppFeedbackInput`` carrying the 1–5 rating, optional
                  free-text comment, and the submitter's IP address.

        Returns:
            ``SubmitAppFeedbackOutput`` wrapping the newly persisted record.

        Raises:
            Exception: Any database failure is rolled back and re-raised as-is;
                       the controller maps it to a 500 response.
        """
        try:
            feedback = await self.repository.create(
                rating=data.rating,
                comment=data.comment,
                ip_address=data.ip_address,
            )
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return SubmitAppFeedbackOutput(feedback=feedback)

    async def get_all_feedback(self, data: GetAppFeedbackInput) -> GetAppFeedbackOutput:
        """Return a paginated list of all feedback records, newest first.

        Enforces ``MAX_PAGE_SIZE`` to prevent oversized result sets.  Pagination
        is offset-based — page 1 is the first page of records.

        Args:
            data: ``GetAppFeedbackInput`` with the 1-indexed page number and
                  desired page size.

        Returns:
            ``GetAppFeedbackOutput`` with the current page of records, total
            count, effective page index, and effective page size.
        """
        page_size = min(data.page_size, self.MAX_PAGE_SIZE)
        feedback, total = await self.repository.get_paginated(page=data.page, page_size=page_size)
        return GetAppFeedbackOutput(
            feedback=feedback,
            total=total,
            page=data.page,
            page_size=page_size,
        )

    async def get_users_per_week(self, data: GetUsersPerWeekInput) -> GetUsersPerWeekOutput:
        """Return weekly user registration counts for the last N ISO weeks.

        Args:
            data: ``GetUsersPerWeekInput`` with the number of past weeks to include.

        Returns:
            ``GetUsersPerWeekOutput`` with one ``UserRegistrationWeek`` entry per
            ISO week, ordered oldest-first.
        """
        entries = await self.repository.get_users_per_week(data.weeks)
        return GetUsersPerWeekOutput(entries=entries)
