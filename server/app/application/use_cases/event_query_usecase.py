"""Use cases for read-only event queries: paginated listing and single-event detail retrieval."""

from app.application.dto.event_dto import (
    EventWithSessionsOutput,
    GetAllEventsInput,
    GetAllEventsOutput,
    GetEventWithSessionsInput,
)
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.infrastructure.database.repositories.event_repository import EventRepository


class GetEventUseCase:
    """Read-only application service for event listing and detail retrieval.

    Concurrency strategy:
        Both operations are pure SELECTs with no mutations, so row-level locking
        (SELECT … FOR UPDATE) is not required. Reads execute at the database's
        default isolation level (READ COMMITTED), which guarantees only committed
        data is visible and eliminates dirty reads. There is no TOCTOU concern
        for read-only flows because no check-then-mutate sequence exists.

    Args:
        repo: Concrete ``EventRepository`` providing data-access methods.
    """

    MAX_PAGE_SIZE: int = 100
    DEFAULT_PAGE_SIZE: int = 20

    def __init__(self, repo: EventRepository) -> None:
        self.repo = repo

    async def get_all_events(self, data: GetAllEventsInput) -> GetAllEventsOutput:
        """Return a paginated list of events with an optional status filter.

        The caller-supplied page size is silently capped at ``MAX_PAGE_SIZE`` to
        prevent runaway queries.  Offset is derived from ``page`` and the
        effective page size.

        Args:
            data: ``GetAllEventsInput`` with optional status filter and pagination params.

        Returns:
            ``GetAllEventsOutput`` containing the event page, total count, and
            pagination metadata (page, page_size, total_pages).
        """
        page_size = min(data.page_size, self.MAX_PAGE_SIZE)
        offset = (data.page - 1) * page_size
        events = await self.repo.get_all_events(status=data.status, limit=page_size, offset=offset)
        total = await self.repo.count_all_events(status=data.status)
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        return GetAllEventsOutput(
            events=events,
            total=total,
            page=data.page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_event_with_sessions(self, data: GetEventWithSessionsInput) -> EventWithSessionsOutput:
        """Return a single event together with all its sessions ordered by start time.

        The event is fetched with a plain (non-locking) SELECT.  Sessions are
        fetched in a second query ordered by ``start_datetime`` ascending.

        Args:
            data: ``GetEventWithSessionsInput`` containing the target event UUID.

        Returns:
            ``EventWithSessionsOutput`` with the event entity and its ordered session list.

        Raises:
            EventNotFoundError: No event row exists for ``data.event_id``.
        """
        event = await self.repo.get_event_by_id(data.event_id)
        if event is None:
            raise EventNotFoundError(str(data.event_id))
        sessions = await self.repo.get_sessions_by_event_id(data.event_id)
        return EventWithSessionsOutput(event=event, sessions=sessions)
