"""Protocol contract for event volunteer management and participant query operations."""

import uuid
from typing import Protocol

from app.domain.entities.event_entity import Event, EventParticipant, EventVolunteer, EventVolunteerStatus
from app.domain.entities.volunteer_entity import Volunteer


class IEventVolunteerRepository(Protocol):
    """Contract for event volunteer assignment lifecycle and cross-event participant read operations."""

    async def get_event_by_id(
        self, event_id: uuid.UUID, *, for_update: bool = False
    ) -> Event | None: ...

    async def get_volunteer_by_id(self, volunteer_id: uuid.UUID) -> Volunteer | None: ...

    async def get_volunteer_by_alias(self, alias: str) -> Volunteer | None: ...

    async def get_event_volunteer_by_id(
        self, event_volunteer_id: uuid.UUID, *, for_update: bool = False
    ) -> EventVolunteer | None: ...

    async def get_event_volunteer_by_volunteer_and_event(
        self,
        volunteer_id: uuid.UUID,
        event_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> EventVolunteer | None: ...

    async def get_joined_event_volunteer_for_user(
        self, user_id: uuid.UUID, event_id: uuid.UUID
    ) -> EventVolunteer | None: ...

    async def get_event_volunteers_by_event(
        self,
        event_id: uuid.UUID,
        *,
        status: EventVolunteerStatus | None = None,
    ) -> list[EventVolunteer]: ...

    async def create_event_volunteer(
        self, volunteer_id: uuid.UUID, event_id: uuid.UUID
    ) -> EventVolunteer: ...

    async def update_event_volunteer_status(
        self, event_volunteer_id: uuid.UUID, new_status: EventVolunteerStatus
    ) -> EventVolunteer | None: ...

    async def delete_event_volunteer(self, event_volunteer_id: uuid.UUID) -> bool: ...

    async def get_participants_by_event(
        self,
        event_id: uuid.UUID,
        *,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[EventParticipant]: ...

    async def count_participants_by_event(
        self, event_id: uuid.UUID, *, status: str | None = None
    ) -> int: ...
