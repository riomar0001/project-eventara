"""Read-only use case for venue capacity queries.

Concurrency strategy — plain SELECT (no locking):
    This use case performs a point-read on a single venue row and returns only
    its physical capacity. Because the result is used exclusively for an
    advisory UI warning — not as a transaction guard before a write — READ
    COMMITTED isolation is sufficient. No ``FOR UPDATE`` lock is acquired; a
    stale capacity value cannot cause data corruption, it can only produce a
    briefly outdated warning in the session form.
"""

from app.application.dto.venue_dto import GetVenueCapacityInput, GetVenueCapacityOutput
from app.domain.exceptions.venue_exceptions import VenueNotFoundError
from app.infrastructure.database.repositories.venue_repository import VenueRepository


class GetVenueCapacityUseCase:
    """Resolve the maximum attendee capacity for a single venue.

    This use case is invoked by the event-session form to surface an advisory
    warning when a session's proposed slot count exceeds the venue's registered
    physical capacity. The response payload is intentionally minimal — only the
    fields required for the slot-overflow check are returned, avoiding the
    overhead of the full venue record.
    """

    def __init__(self, repo: VenueRepository) -> None:
        self.repo = repo

    async def get_venue_capacity(self, data: GetVenueCapacityInput) -> GetVenueCapacityOutput:
        """Return the physical capacity of the requested venue.

        Args:
            data: Input DTO containing the venue UUID to look up.

        Returns:
            Output DTO with the venue's id, display name, and capacity.

        Raises:
            VenueNotFoundError: No venue row exists for the supplied UUID.
        """
        venue = await self.repo.get_venue_by_id(data.venue_id)
        if venue is None:
            raise VenueNotFoundError(str(data.venue_id))
        return GetVenueCapacityOutput(
            venue_id=venue.id,
            name=venue.name,
            capacity=venue.capacity,
        )
