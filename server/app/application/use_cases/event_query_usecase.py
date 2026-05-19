"""Use cases for read-only event queries: paginated listing and single-event detail retrieval."""

import uuid

from app.application.dto.event_dto import (
    EventWithSessionsOutput,
    GetAllEventsInput,
    GetAllEventsOutput,
    GetEventWithSessionsInput,
    GetPublicEventsInput,
    HomeEventRecord,
    HomeEventsOutput,
    PublicEventsOutput,
)
from app.domain.entities.event_entity import EventStatus
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

    async def get_home_events(self) -> HomeEventsOutput:
        """Return events for the public home page.

        Fetches the currently live event (status=started) with its sessions,
        then upcoming events (status=posted).  When no upcoming events exist,
        falls back to the most-recent past events (status=ended).  All session
        data is retrieved in a single batched query to avoid N+1 round-trips.

        Returns:
            ``HomeEventsOutput`` containing the live event, its sessions, a list
            of upcoming-or-past event records (each with sessions), and a
            string ``events_type`` of either ``"upcoming"`` or ``"past"``.
        """
        started = await self.repo.get_all_events(status=EventStatus.STARTED, limit=1)
        live_event = started[0] if started else None
        live_sessions = await self.repo.get_sessions_by_event_id(live_event.id) if live_event else []

        upcoming = await self.repo.get_all_events(status=EventStatus.POSTED, limit=6)
        if upcoming:
            event_list = upcoming
            events_type = "upcoming"
        else:
            event_list = await self.repo.get_all_events(status=EventStatus.ENDED, limit=6)
            events_type = "past"

        event_ids: list[uuid.UUID] = [e.id for e in event_list]
        all_sessions = await self.repo.get_sessions_for_events(event_ids)

        sessions_by_event: dict[uuid.UUID, list] = {}
        for s in all_sessions:
            sessions_by_event.setdefault(s.event_id, []).append(s)

        events = [HomeEventRecord(event=e, sessions=sessions_by_event.get(e.id, [])) for e in event_list]

        return HomeEventsOutput(
            live_event=live_event,
            live_event_sessions=live_sessions,
            events=events,
            events_type=events_type,
        )

    async def get_public_events(self, data: GetPublicEventsInput) -> PublicEventsOutput:
        """Return a paginated, searchable list of public events for the events directory.

        Shows upcoming (posted) events by default; falls back to ended (past) events
        when no upcoming events match.  Text search filters on event title.

        Args:
            data: ``GetPublicEventsInput`` containing optional search query and pagination.

        Returns:
            ``PublicEventsOutput`` with the event list, pagination metadata, and
            ``events_type`` indicating ``"upcoming"`` or ``"past"``.
        """
        page_size = min(data.page_size, 50)
        offset = (data.page - 1) * page_size

        total = await self.repo.count_public_events(status=EventStatus.POSTED, q=data.q)
        events_type = "upcoming"
        if total == 0:
            total = await self.repo.count_public_events(status=EventStatus.ENDED, q=data.q)
            events_type = "past"

        target_status = EventStatus.POSTED if events_type == "upcoming" else EventStatus.ENDED
        event_list = await self.repo.get_public_events(status=target_status, q=data.q, limit=page_size, offset=offset)

        event_ids: list[uuid.UUID] = [e.id for e in event_list]
        all_sessions = await self.repo.get_sessions_for_events(event_ids)

        sessions_by_event: dict[uuid.UUID, list] = {}
        for s in all_sessions:
            sessions_by_event.setdefault(s.event_id, []).append(s)

        events = [HomeEventRecord(event=e, sessions=sessions_by_event.get(e.id, [])) for e in event_list]
        total_pages = max(1, (total + page_size - 1) // page_size)

        return PublicEventsOutput(
            events=events,
            total=total,
            page=data.page,
            page_size=page_size,
            total_pages=total_pages,
            events_type=events_type,
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
