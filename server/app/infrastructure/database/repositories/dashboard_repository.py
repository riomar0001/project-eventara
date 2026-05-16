"""Dashboard repository: read-only aggregate SQL queries for platform metrics."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.dashboard_entity import (
    EventSummary,
    ParticipantLeaderboardEntry,
    UserRegistrationWeek,
    VenueUsageSummary,
    VolunteerLeaderboardEntry,
)
from app.infrastructure.database.models.event_models import Event, EventParticipant, EventVolunteer
from app.infrastructure.database.models.user_models import User, UserProfile
from app.infrastructure.database.models.venue_models import Venue
from app.infrastructure.database.models.volunteer_models import Volunteer, VolunteerApplication, VolunteerRole


class DashboardRepository:
    """Concrete read-only repository that aggregates platform metrics for the dashboard.

    Every method issues a single SELECT query and maps results to domain value objects.
    No writes are performed, and no locks are acquired.  All methods share the caller's
    AsyncSession, so they run sequentially on the same database connection within the
    same implicit READ COMMITTED transaction.

    Week boundaries follow PostgreSQL's date_trunc('week', ...) semantics which truncates
    to the most recent Monday at 00:00 UTC.

    Args:
        db: SQLAlchemy AsyncSession provided by the request-scoped dependency.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_recent_events(self, limit: int) -> list[EventSummary]:
        """Return the most recently created events, newest first."""
        stmt = select(Event).order_by(Event.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return [self._event_to_summary(e) for e in result.scalars().all()]

    async def get_ongoing_events(self) -> list[EventSummary]:
        """Return all events currently in 'started' status, ordered by start date ascending."""
        stmt = select(Event).where(Event.status == "started").order_by(Event.start_date.asc())
        result = await self.db.execute(stmt)
        return [self._event_to_summary(e) for e in result.scalars().all()]

    async def get_upcoming_events(self, limit: int) -> list[EventSummary]:
        """Return posted events with a future start date, soonest first."""
        now = datetime.now(UTC)
        stmt = select(Event).where(Event.status == "posted", Event.start_date > now).order_by(Event.start_date.asc()).limit(limit)
        result = await self.db.execute(stmt)
        return [self._event_to_summary(e) for e in result.scalars().all()]

    async def get_top_weekly_participants(self, limit: int) -> list[ParticipantLeaderboardEntry]:
        """Return users ranked by new event session registrations created in the current ISO week."""
        week_start = self._current_week_start()
        stmt = (
            select(
                EventParticipant.user_id,
                func.count(EventParticipant.id).label("count"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                UserProfile.image_file_id,
            )
            .join(UserProfile, UserProfile.user_id == EventParticipant.user_id, isouter=True)
            .where(EventParticipant.created_at >= week_start)
            .group_by(
                EventParticipant.user_id,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                UserProfile.image_file_id,
            )
            .order_by(func.count(EventParticipant.id).desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return [
            ParticipantLeaderboardEntry(
                user_id=row.user_id,
                full_name=self._full_name(row.first_name, row.last_name),
                alias=row.alias,
                profile_picture_url=row.image_file_id,
                count=row.count,
            )
            for row in result.all()
        ]

    async def get_top_weekly_volunteer_applications(self, limit: int) -> list[VolunteerLeaderboardEntry]:
        """Return users ranked by volunteer applications submitted in the current ISO week."""
        week_start = self._current_week_start()
        stmt = (
            select(
                VolunteerApplication.user_id,
                func.count(VolunteerApplication.id).label("count"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                UserProfile.image_file_id,
            )
            .join(UserProfile, UserProfile.user_id == VolunteerApplication.user_id, isouter=True)
            .where(VolunteerApplication.created_at >= week_start)
            .group_by(
                VolunteerApplication.user_id,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                UserProfile.image_file_id,
            )
            .order_by(func.count(VolunteerApplication.id).desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return [
            VolunteerLeaderboardEntry(
                user_id=row.user_id,
                full_name=self._full_name(row.first_name, row.last_name),
                alias=row.alias,
                profile_picture_url=row.image_file_id,
                count=row.count,
            )
            for row in result.all()
        ]

    async def get_top_active_volunteers(self, limit: int) -> list[VolunteerLeaderboardEntry]:
        """Return volunteers ranked by total number of events joined (status='joined')."""
        stmt = (
            select(
                EventVolunteer.volunteer_id,
                Volunteer.user_id,
                func.count(EventVolunteer.id).label("count"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                UserProfile.image_file_id,
                VolunteerRole.name.label("role_name"),
            )
            .join(Volunteer, Volunteer.id == EventVolunteer.volunteer_id, isouter=True)
            .join(UserProfile, UserProfile.user_id == Volunteer.user_id, isouter=True)
            .join(VolunteerRole, VolunteerRole.id == Volunteer.volunteer_role_id, isouter=True)
            .where(EventVolunteer.status == "joined")
            .group_by(
                EventVolunteer.volunteer_id,
                Volunteer.user_id,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                UserProfile.image_file_id,
                VolunteerRole.name,
            )
            .order_by(func.count(EventVolunteer.id).desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return [
            VolunteerLeaderboardEntry(
                volunteer_id=row.volunteer_id,
                user_id=row.user_id,
                full_name=self._full_name(row.first_name, row.last_name),
                alias=row.alias,
                profile_picture_url=row.image_file_id,
                role_name=row.role_name,
                count=row.count,
            )
            for row in result.all()
        ]

    async def get_top_active_participants(self, limit: int) -> list[ParticipantLeaderboardEntry]:
        """Return users ranked by all-time event participation count (registered or attended)."""
        stmt = (
            select(
                EventParticipant.user_id,
                func.count(EventParticipant.id).label("count"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                UserProfile.image_file_id,
            )
            .join(UserProfile, UserProfile.user_id == EventParticipant.user_id, isouter=True)
            .where(EventParticipant.status.in_(["registered", "attended"]))
            .group_by(
                EventParticipant.user_id,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                UserProfile.image_file_id,
            )
            .order_by(func.count(EventParticipant.id).desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return [
            ParticipantLeaderboardEntry(
                user_id=row.user_id,
                full_name=self._full_name(row.first_name, row.last_name),
                alias=row.alias,
                profile_picture_url=row.image_file_id,
                count=row.count,
            )
            for row in result.all()
        ]

    async def get_top_venues(self, limit: int) -> list[VenueUsageSummary]:
        """Return venues ranked by total number of event sessions hosted across all events."""
        from app.infrastructure.database.models.event_models import EventSession

        stmt = (
            select(
                Venue.id.label("venue_id"),
                Venue.name,
                Venue.city,
                Venue.province,
                func.count(EventSession.id).label("event_session_count"),
            )
            .join(EventSession, EventSession.venue_id == Venue.id, isouter=True)
            .group_by(Venue.id, Venue.name, Venue.city, Venue.province)
            .order_by(func.count(EventSession.id).desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return [
            VenueUsageSummary(
                venue_id=row.venue_id,
                name=row.name,
                city=row.city,
                province=row.province,
                event_session_count=row.event_session_count,
            )
            for row in result.all()
        ]

    async def get_users_per_week(self, weeks: int) -> list[UserRegistrationWeek]:
        """Return weekly non-deleted user registration counts for the last N weeks.

        Grouped by PostgreSQL date_trunc('week', created_at) which produces the Monday
        of each ISO week.  The returned week_end is the Sunday of that same week
        (6 days and 23:59:59 after week_start).
        """
        earliest = datetime.now(UTC) - timedelta(weeks=weeks)
        stmt = (
            select(
                func.date_trunc("week", User.created_at).label("week_start"),
                func.count(User.id).label("count"),
            )
            .where(User.created_at >= earliest, User.deleted_at.is_(None))
            .group_by("week_start")
            .order_by("week_start")
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

    def _event_to_summary(self, event: Event) -> EventSummary:
        return EventSummary(
            id=event.id,
            title=event.title,
            status=event.status,
            start_date=event.start_date,
            end_date=event.end_date,
            created_at=event.created_at,
        )

    def _full_name(self, first_name: str | None, last_name: str | None) -> str | None:
        if not first_name and not last_name:
            return None
        return f"{first_name or ''} {last_name or ''}".strip()

    def _current_week_start(self) -> datetime:
        now = datetime.now(UTC)
        return (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
