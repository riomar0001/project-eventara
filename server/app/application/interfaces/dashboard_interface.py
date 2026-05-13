from typing import Protocol

from app.domain.entities.dashboard_entity import (
    EventSummary,
    ParticipantLeaderboardEntry,
    UserRegistrationWeek,
    VenueUsageSummary,
    VolunteerLeaderboardEntry,
)


class IDashboardRepository(Protocol):
    """Contract for read-only aggregate data retrieval used by the admin dashboard.

    All methods are pure queries — no writes are performed.  Implementations must
    not acquire exclusive locks or perform any mutation as part of these calls.
    """

    async def get_recent_events(self, limit: int) -> list[EventSummary]: ...

    async def get_ongoing_events(self) -> list[EventSummary]: ...

    async def get_upcoming_events(self, limit: int) -> list[EventSummary]: ...

    async def get_top_weekly_participants(self, limit: int) -> list[ParticipantLeaderboardEntry]: ...

    async def get_top_weekly_volunteer_applications(self, limit: int) -> list[VolunteerLeaderboardEntry]: ...

    async def get_top_active_volunteers(self, limit: int) -> list[VolunteerLeaderboardEntry]: ...

    async def get_top_active_participants(self, limit: int) -> list[ParticipantLeaderboardEntry]: ...

    async def get_top_venues(self, limit: int) -> list[VenueUsageSummary]: ...

    async def get_users_per_week(self, weeks: int) -> list[UserRegistrationWeek]: ...
