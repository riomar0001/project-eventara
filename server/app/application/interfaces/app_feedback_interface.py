from typing import Protocol

from app.domain.entities.app_feedback_entity import AppFeedback
from app.domain.entities.dashboard_entity import UserRegistrationWeek


class IAppFeedbackRepository(Protocol):
    """Contract for anonymous app feedback persistence and user-registration analytics.

    Write methods flush within the caller's transaction; commit is never called
    here so the use-case layer owns the transaction lifecycle.  Read methods
    issue pure SELECT queries with no side effects.
    """

    async def create(self, rating: int, comment: str | None, ip_address: str | None) -> AppFeedback: ...

    async def get_paginated(self, page: int, page_size: int) -> tuple[list[AppFeedback], int]: ...

    async def get_users_per_week(self, weeks: int) -> list[UserRegistrationWeek]: ...
