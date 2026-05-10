"""Use cases for event creation, metadata update, and individual session update."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_dto import (
    CreateEventInput,
    EventWithSessionsOutput,
    UpdateEventBannerInput,
    UpdateEventBannerOutput,
    UpdateEventMetadataInput,
    UpdateEventMetadataOutput,
    UpdateEventSessionInput,
    UpdateEventSessionOutput,
)
from app.domain.exceptions.event_exceptions import (
    EventDateValidationError,
    EventNotFoundError,
    EventValidationError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventSessionExceedsEventBoundsError,
    EventSessionNotFoundError,
    InvalidEventSessionDateError,
)
from app.domain.exceptions.venue_exceptions import VenueNotFoundError
from app.infrastructure.database.repositories.event_repository import EventRepository


class EventUseCase:
    """Application service for all event and session operations.

    Owns the transaction lifecycle for every mutating operation: commits on
    success, rolls back on any validation or infrastructure failure, then
    re-raises the exception.

    Concurrency strategy:
        ``create_event`` — single atomic transaction with no row lock (event
        titles are not globally unique, so there is no natural lock target).

        ``update_event_metadata`` / ``update_event_session`` — pessimistic
        locking (SELECT … FOR UPDATE) on the event row before any
        read-then-write sequence, serialising concurrent updates on the same
        event and eliminating TOCTOU races.

    Args:
        repo: Concrete ``EventRepository`` providing data-access methods.
        db:   The active async database session used for commit and rollback.
    """

    def __init__(self, repo: EventRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def create_event(self, data: CreateEventInput) -> EventWithSessionsOutput:
        """Create an event and all its sessions in a single atomic transaction.

        Validation order:
        1. Event date range (end must be strictly after start).
        2. Non-empty sessions list.
        3. Per-session: end must be strictly after start.
        4. Per-session: window must fall within the event date range.
        5. Per-session: the referenced venue must exist.

        Raises:
            EventDateValidationError: ``end_date`` ≤ ``start_date``.
            EventValidationError: The sessions list is empty.
            InvalidEventSessionDateError: A session's ``end_datetime`` ≤ ``start_datetime``.
            EventSessionExceedsEventBoundsError: A session window outside event range.
            VenueNotFoundError: A session references a non-existent venue.
        """
        if data.end_date <= data.start_date:
            raise EventDateValidationError("Event end_date must be after start_date")

        if not data.sessions:
            raise EventValidationError("At least one session is required")

        for s in data.sessions:
            if s.end_datetime <= s.start_datetime:
                raise InvalidEventSessionDateError(str(s.start_datetime), str(s.end_datetime))
            if s.start_datetime < data.start_date or s.end_datetime > data.end_date:
                raise EventSessionExceedsEventBoundsError(
                    str(s.start_datetime),
                    str(s.end_datetime),
                    str(data.start_date),
                    str(data.end_date),
                )

        for s in data.sessions:
            if not await self.repo.venue_exists(s.venue_id):
                raise VenueNotFoundError()

        try:
            event = await self.repo.create_event(
                title=data.title,
                description=data.description,
                start_date=data.start_date,
                end_date=data.end_date,
                created_by=data.created_by,
                banner_url=data.banner_url,
            )
            sessions = []
            for s in data.sessions:
                sessions.append(
                    await self.repo.create_session(
                        event_id=event.id,
                        venue_id=s.venue_id,
                        title=s.title,
                        description=s.description,
                        start_datetime=s.start_datetime,
                        end_datetime=s.end_datetime,
                        max_slots=s.max_slots,
                    )
                )
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return EventWithSessionsOutput(event=event, sessions=sessions)

    async def update_event_metadata(self, data: UpdateEventMetadataInput) -> UpdateEventMetadataOutput:
        """Update title, description, and date range for an existing event.

        Validation order:
        1. Event exists (with row lock).
        2. Caller is the event creator.
        3. Event date range is valid (end strictly after start).

        Raises:
            EventNotFoundError: No event exists for ``data.event_id``.
            UnauthorizedEventOperationError: Caller is not the event creator.
            EventDateValidationError: ``end_date`` ≤ ``start_date``.
        """
        event = await self.repo.get_event_by_id(data.event_id, for_update=True)
        if event is None:
            raise EventNotFoundError(str(data.event_id))

        if event.created_by != data.updated_by:
            raise UnauthorizedEventOperationError(str(data.event_id))

        if data.end_date <= data.start_date:
            raise EventDateValidationError("Event end_date must be after start_date")

        try:
            updated_event = await self.repo.update_event(
                event_id=data.event_id,
                title=data.title,
                description=data.description,
                start_date=data.start_date,
                end_date=data.end_date,
                banner_url=data.banner_url,
            )
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateEventMetadataOutput(event=updated_event, old_event=event)

    async def update_event_banner(self, data: UpdateEventBannerInput) -> UpdateEventBannerOutput:
        """Replace the banner image object key for an existing event.

        Acquires a pessimistic row-level lock on the event before the
        ownership check and the URL write, serialising concurrent banner-update
        requests for the same event and eliminating the TOCTOU window between
        the authorisation check and the UPDATE.

        The presigned upload URL has already been generated by the caller
        (route layer) before this method is invoked, so the storage service is
        never called inside the database transaction.

        Args:
            data: ``UpdateEventBannerInput`` with event_id, acting user_id,
                  and the object key to store as the banner.

        Returns:
            ``UpdateEventBannerOutput`` with the updated event entity and the
            previous banner object key (for audit log construction).

        Raises:
            EventNotFoundError: No event exists for ``data.event_id``.
            UnauthorizedEventOperationError: Caller is not the event creator.
        """
        event = await self.repo.get_event_by_id(data.event_id, for_update=True)
        if event is None:
            raise EventNotFoundError(str(data.event_id))

        if event.created_by != data.updated_by:
            raise UnauthorizedEventOperationError(str(data.event_id))

        old_banner_url = event.banner_url

        try:
            updated_event = await self.repo.update_event_banner(event_id=data.event_id, banner_url=data.banner_url)
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateEventBannerOutput(event=updated_event, old_banner_url=old_banner_url)

    async def update_event_session(self, data: UpdateEventSessionInput) -> UpdateEventSessionOutput:
        """Update the fields of a single event session by its ID.

        Validation order:
        1. Session exists.
        2. Parent event exists (with row lock).
        3. Caller is the event creator.
        4. Session end strictly after start.
        5. Session window within the current event date range.
        6. Referenced venue exists.

        Raises:
            EventSessionNotFoundError: No session for ``data.session_id``.
            EventNotFoundError: Parent event no longer exists.
            UnauthorizedEventOperationError: Caller is not the event creator.
            InvalidEventSessionDateError: ``end_datetime`` ≤ ``start_datetime``.
            EventSessionExceedsEventBoundsError: Session outside event range.
            VenueNotFoundError: Referenced venue does not exist.
        """
        old_session = await self.repo.get_session_by_id(data.session_id)
        if old_session is None:
            raise EventSessionNotFoundError(str(data.session_id))

        event = await self.repo.get_event_by_id(old_session.event_id, for_update=True)
        if event is None:
            raise EventNotFoundError(str(old_session.event_id))

        if event.created_by != data.updated_by:
            raise UnauthorizedEventOperationError(str(event.id))

        if data.end_datetime <= data.start_datetime:
            raise InvalidEventSessionDateError(str(data.start_datetime), str(data.end_datetime))

        if data.start_datetime < event.start_date or data.end_datetime > event.end_date:
            raise EventSessionExceedsEventBoundsError(
                str(data.start_datetime),
                str(data.end_datetime),
                str(event.start_date),
                str(event.end_date),
            )

        if not await self.repo.venue_exists(data.venue_id):
            raise VenueNotFoundError()

        try:
            updated_session = await self.repo.update_session(
                session_id=data.session_id,
                venue_id=data.venue_id,
                title=data.title,
                description=data.description,
                start_datetime=data.start_datetime,
                end_datetime=data.end_datetime,
                max_slots=data.max_slots,
            )
            if updated_session is None:
                raise EventSessionNotFoundError(str(data.session_id))
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateEventSessionOutput(session=updated_session, old_session=old_session)
