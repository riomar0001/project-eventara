"""Analytics repository — read-only aggregate SQL queries for all five analytics domains."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.analytics_entities import (
    AccountAgeDistribution,
    AttendanceRate,
    BrowserBreakdown,
    CancelledEventReport,
    CityParticipation,
    DeviceBreakdown,
    EndedEventSummary,
    EventAttendanceRate,
    EventInterestCategory,
    EventLogisticsOverview,
    EventStatusTransition,
    FeedbackCompleteness,
    FeedbackScoreSummary,
    FeedbackTrendPoint,
    FirstTimeVsReturning,
    GenderDistribution,
    GeographicSpread,
    LateRegistration,
    LiveAttendance,
    LiveCheckinEntry,
    OrganizerOutput,
    OsBreakdown,
    PendingWithdrawalAlert,
    RegistrationLogistics,
    SessionProgress,
    SessionStatusDistribution,
    SessionTimeline,
    SessionTimelineEntry,
    SessionUtilisation,
    SessionVenueAssignment,
    StartedEventSummary,
    TopRatedEvent,
    VenueCapacityVsRegistration,
    VolunteerLogistics,
    VolunteerOnDuty,
    VolunteerPerformance,
    VolunteerRoleBreakdown,
    VolunteerRosterEntry,
    YearOverYearAttendance,
)
from app.infrastructure.database.models.event_models import (
    Event,
    EventFeedback,
    EventParticipant,
    EventSession,
    EventVolunteer,
)
from app.infrastructure.database.models.user_models import User, UserLoginHistory, UserProfile
from app.infrastructure.database.models.venue_models import Venue
from app.infrastructure.database.models.volunteer_models import Volunteer, VolunteerRole


def _now() -> datetime:
    return datetime.now(UTC)


class AnalyticsRepository:
    """Concrete read-only repository for analytics queries.

    Every method issues read-only SELECT queries against the existing
    ORM models. No writes are performed. All methods share the caller's
    AsyncSession.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Logistics ──────────────────────────────────────────────────────

    async def get_event_logistics_overview(self, event_id: uuid.UUID) -> EventLogisticsOverview:
        event = await self.db.get(Event, event_id)
        if event is None:
            from app.domain.exceptions.analytics_exceptions import EventNotFoundError

            raise EventNotFoundError(f"Event {event_id} not found")

        sessions_stmt = select(EventSession).where(EventSession.event_id == event_id).order_by(EventSession.start_datetime.asc())
        sessions_result = await self.db.execute(sessions_stmt)
        sessions = list(sessions_result.scalars().all())

        venue_assignments: list[SessionVenueAssignment] = []
        utilisation: list[SessionUtilisation] = []
        over_capacity: list[SessionUtilisation] = []
        vcvr: list[VenueCapacityVsRegistration] = []

        for session in sessions:
            venue = await self.db.get(Venue, session.venue_id)

            registered_count_stmt = select(func.count(EventParticipant.id)).where(EventParticipant.event_session_id == session.id)
            registered_count = (await self.db.execute(registered_count_stmt)).scalar() or 0

            checked_in_count_stmt = select(func.count(EventParticipant.id)).where(
                EventParticipant.event_session_id == session.id,
                EventParticipant.is_checked_in.is_(True),
            )
            checked_in_count = (await self.db.execute(checked_in_count_stmt)).scalar() or 0

            util_pct = None
            if session.max_slots and session.max_slots > 0:
                util_pct = round(checked_in_count / session.max_slots * 100, 2)
            elif session.max_slots == 0:
                util_pct = 0.0

            is_over = False
            if venue and registered_count > venue.capacity:
                is_over = True

            venue_assignments.append(
                SessionVenueAssignment(
                    session_id=session.id,
                    session_title=session.title,
                    venue_id=session.venue_id,
                    venue_name=venue.name if venue else "Unknown",
                    venue_city=venue.city if venue else None,
                    venue_capacity=venue.capacity if venue else 0,
                )
            )

            session_util = SessionUtilisation(
                session_id=session.id,
                session_title=session.title,
                checked_in=checked_in_count,
                max_slots=session.max_slots,
                utilisation_pct=util_pct,
                over_capacity=is_over,
            )
            utilisation.append(session_util)
            if is_over:
                over_capacity.append(session_util)

            vcvr.append(
                VenueCapacityVsRegistration(
                    session_id=session.id,
                    session_title=session.title,
                    venue_capacity=venue.capacity if venue else 0,
                    registered_count=registered_count,
                )
            )

        return EventLogisticsOverview(
            event_id=event.id,
            event_title=event.title,
            total_sessions=len(sessions),
            scheduled_dates=[s.start_datetime for s in sessions],
            venue_assignments=venue_assignments,
            session_utilisation=utilisation,
            over_capacity_sessions=over_capacity,
            venue_capacity_vs_registrations=vcvr,
        )

    async def get_session_utilisation(self, event_id: uuid.UUID) -> list[VenueCapacityVsRegistration]:
        overview = await self.get_event_logistics_overview(event_id)
        return overview.venue_capacity_vs_registrations

    async def get_session_timeline(self) -> SessionTimeline:
        now = _now()

        stmt = (
            select(
                EventSession.id.label("session_id"),
                EventSession.title.label("session_title"),
                EventSession.event_id,
                EventSession.venue_id,
                EventSession.start_datetime,
                EventSession.end_datetime,
                EventSession.status,
                Event.title.label("event_title"),
                Venue.name.label("venue_name"),
            )
            .join(Event, Event.id == EventSession.event_id)
            .join(Venue, Venue.id == EventSession.venue_id)
        )
        result = await self.db.execute(stmt)
        all_sessions = result.all()

        def _make_entry(row) -> SessionTimelineEntry:
            return SessionTimelineEntry(
                session_id=row.session_id,
                session_title=row.session_title,
                event_id=row.event_id,
                event_title=row.event_title,
                venue_id=row.venue_id,
                venue_name=row.venue_name,
                start_datetime=row.start_datetime,
                end_datetime=row.end_datetime,
                status=row.status,
            )

        ongoing = [_make_entry(r) for r in all_sessions if r.start_datetime <= now <= r.end_datetime]
        upcoming = sorted(
            [_make_entry(r) for r in all_sessions if r.start_datetime > now],
            key=lambda x: x.start_datetime,
        )
        completed = sorted(
            [_make_entry(r) for r in all_sessions if r.end_datetime < now],
            key=lambda x: x.end_datetime,
            reverse=True,
        )

        return SessionTimeline(ongoing=ongoing, upcoming=upcoming, completed=completed)

    async def get_volunteer_logistics(self, event_id: uuid.UUID) -> VolunteerLogistics:
        event = await self.db.get(Event, event_id)
        if event is None:
            from app.domain.exceptions.analytics_exceptions import EventNotFoundError

            raise EventNotFoundError(f"Event {event_id} not found")

        joined_stmt = (
            select(
                EventVolunteer.volunteer_id,
                Volunteer.user_id,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                VolunteerRole.name.label("role_name"),
                Volunteer.contact_phone,
                EventVolunteer.status,
            )
            .join(Volunteer, Volunteer.id == EventVolunteer.volunteer_id)
            .join(UserProfile, UserProfile.user_id == Volunteer.user_id, isouter=True)
            .join(VolunteerRole, VolunteerRole.id == Volunteer.volunteer_role_id, isouter=True)
            .where(EventVolunteer.event_id == event_id)
        )
        result = await self.db.execute(joined_stmt)
        all_volunteers = result.all()

        joined = [v for v in all_volunteers if v.status == "joined"]
        pending = [v for v in all_volunteers if v.status == "pending"]

        roster = [
            VolunteerRosterEntry(
                volunteer_id=v.volunteer_id,
                user_id=v.user_id,
                first_name=v.first_name,
                last_name=v.last_name,
                alias=v.alias,
                role_name=v.role_name,
                contact_phone=v.contact_phone,
                status=v.status,
            )
            for v in joined
        ]

        checked_in_count_stmt = (
            select(func.count(EventParticipant.id))
            .join(EventSession, EventSession.id == EventParticipant.event_session_id)
            .where(
                EventSession.event_id == event_id,
                EventParticipant.is_checked_in.is_(True),
            )
        )
        checked_in_count = (await self.db.execute(checked_in_count_stmt)).scalar() or 0

        ratio = None
        if checked_in_count > 0:
            ratio = round(len(joined) / checked_in_count, 4)

        return VolunteerLogistics(
            event_id=event.id,
            event_title=event.title,
            joined_volunteer_count=len(joined),
            joined_volunteer_roster=roster,
            volunteer_to_participant_ratio=ratio,
            pending_volunteer_count=len(pending),
        )

    async def get_registration_logistics(self, event_id: uuid.UUID) -> list[RegistrationLogistics]:
        sessions_stmt = select(EventSession).where(EventSession.event_id == event_id)
        result = await self.db.execute(sessions_stmt)
        sessions = list(result.scalars().all())

        output: list[RegistrationLogistics] = []
        for session in sessions:
            total_stmt = select(func.count(EventParticipant.id)).where(EventParticipant.event_session_id == session.id)
            total = (await self.db.execute(total_stmt)).scalar() or 0

            cancelled_stmt = select(func.count(EventParticipant.id)).where(
                EventParticipant.event_session_id == session.id,
                EventParticipant.status == "cancelled",
            )
            cancelled = (await self.db.execute(cancelled_stmt)).scalar() or 0

            no_show_stmt = select(func.count(EventParticipant.id)).where(
                EventParticipant.event_session_id == session.id,
                EventParticipant.status == "no_show",
            )
            no_show = (await self.db.execute(no_show_stmt)).scalar() or 0

            # QR check-in: checked_in_by is NOT NULL and is_checked_in = True
            qr_stmt = select(func.count(EventParticipant.id)).where(
                EventParticipant.event_session_id == session.id,
                EventParticipant.is_checked_in.is_(True),
                EventParticipant.checked_in_by.isnot(None),
            )
            qr_count = (await self.db.execute(qr_stmt)).scalar() or 0

            # Manual check-in: is_checked_in = True and checked_in_by IS NULL
            manual_stmt = select(func.count(EventParticipant.id)).where(
                EventParticipant.event_session_id == session.id,
                EventParticipant.is_checked_in.is_(True),
                EventParticipant.checked_in_by.is_(None),
            )
            manual_count = (await self.db.execute(manual_stmt)).scalar() or 0

            cancel_rate = None
            if total > 0:
                cancel_rate = round(cancelled / total * 100, 2)

            checked_in_eligible = total - cancelled
            no_show_rate = None
            if checked_in_eligible > 0:
                no_show_rate = round(no_show / checked_in_eligible * 100, 2)

            output.append(
                RegistrationLogistics(
                    session_id=session.id,
                    session_title=session.title,
                    total_registrations=total,
                    cancelled_count=cancelled,
                    cancellation_rate_pct=cancel_rate,
                    no_show_count=no_show,
                    no_show_rate_pct=no_show_rate,
                    qr_checkin_count=qr_count,
                    manual_checkin_count=manual_count,
                )
            )

        return output

    # ── Performance ────────────────────────────────────────────────────

    async def get_attendance_rates(self, event_id: uuid.UUID | None = None) -> list[AttendanceRate]:
        stmt = select(
            EventSession.id.label("session_id"),
            EventSession.title.label("session_title"),
            EventSession.event_id,
            func.count(EventParticipant.id).label("registered_count"),
            func.sum(case((EventParticipant.status == "attended", 1), else_=0)).label("attended_count"),
        ).join(EventParticipant, EventParticipant.event_session_id == EventSession.id, isouter=True)
        if event_id:
            stmt = stmt.where(EventSession.event_id == event_id)
        stmt = stmt.group_by(EventSession.id, EventSession.title, EventSession.event_id)
        result = await self.db.execute(stmt)
        rows = result.all()

        output: list[AttendanceRate] = []
        for row in rows:
            rate = None
            if row.registered_count > 0:
                rate = round(row.attended_count / row.registered_count * 100, 2)
            output.append(
                AttendanceRate(
                    session_id=row.session_id,
                    session_title=row.session_title,
                    event_id=row.event_id,
                    registered_count=row.registered_count,
                    attended_count=row.attended_count,
                    attendance_rate_pct=rate,
                )
            )
        return output

    async def get_event_attendance_rates(self) -> list[EventAttendanceRate]:
        stmt = (
            select(
                Event.id.label("event_id"),
                Event.title.label("event_title"),
                func.count(func.distinct(EventParticipant.id)).label("registered_count"),
                func.sum(case((EventParticipant.status == "attended", 1), else_=0)).label("attended_count"),
            )
            .join(EventSession, EventSession.event_id == Event.id)
            .join(EventParticipant, EventParticipant.event_session_id == EventSession.id, isouter=True)
            .where(Event.status.in_(["ended", "started"]))
            .group_by(Event.id, Event.title)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        output: list[EventAttendanceRate] = []
        for row in rows:
            rate = None
            if row.registered_count > 0:
                rate = round(row.attended_count / row.registered_count * 100, 2)
            output.append(
                EventAttendanceRate(
                    event_id=row.event_id,
                    event_title=row.event_title,
                    registered_count=row.registered_count,
                    attended_count=row.attended_count,
                    attendance_rate_pct=rate,
                )
            )
        return output

    async def get_feedback_summaries(self) -> list[FeedbackScoreSummary]:
        stmt = (
            select(
                Event.id.label("event_id"),
                Event.title.label("event_title"),
                func.avg(EventFeedback.rating).label("avg_rating"),
                func.count(EventFeedback.id).label("feedback_count"),
            )
            .join(EventFeedback, EventFeedback.event_id == Event.id, isouter=True)
            .where(Event.status == "ended")
            .group_by(Event.id, Event.title)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            FeedbackScoreSummary(
                event_id=row.event_id,
                event_title=row.event_title,
                average_rating=round(float(row.avg_rating), 2) if row.avg_rating else None,
                total_feedback_count=row.feedback_count,
            )
            for row in rows
        ]

    async def get_feedback_trend(self, limit: int) -> list[FeedbackTrendPoint]:
        stmt = (
            select(
                Event.id.label("event_id"),
                Event.title.label("event_title"),
                Event.end_date,
                func.avg(EventFeedback.rating).label("avg_rating"),
                func.count(EventFeedback.id).label("feedback_count"),
            )
            .join(EventFeedback, EventFeedback.event_id == Event.id)
            .where(Event.status == "ended")
            .group_by(Event.id, Event.title, Event.end_date)
            .order_by(Event.end_date.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            FeedbackTrendPoint(
                event_id=row.event_id,
                event_title=row.event_title,
                end_date=row.end_date,
                average_rating=round(float(row.avg_rating), 2) if row.avg_rating else None,
                feedback_count=row.feedback_count,
            )
            for row in reversed(rows)
        ]

    async def get_top_rated_events(self, limit: int, min_feedback_count: int) -> list[TopRatedEvent]:
        stmt = (
            select(
                Event.id.label("event_id"),
                Event.title.label("event_title"),
                func.avg(EventFeedback.rating).label("avg_rating"),
                func.count(EventFeedback.id).label("feedback_count"),
            )
            .join(EventFeedback, EventFeedback.event_id == Event.id)
            .where(Event.status == "ended")
            .group_by(Event.id, Event.title)
            .having(func.count(EventFeedback.id) >= min_feedback_count)
            .order_by(func.avg(EventFeedback.rating).desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            TopRatedEvent(
                event_id=row.event_id,
                event_title=row.event_title,
                average_rating=round(float(row.avg_rating), 2),
                feedback_count=row.feedback_count,
            )
            for row in rows
        ]

    async def get_volunteer_performance(self) -> list[VolunteerPerformance]:
        stmt = (
            select(
                EventVolunteer.volunteer_id,
                Volunteer.user_id,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                VolunteerRole.name.label("role_name"),
                func.coalesce(func.sum(case((EventVolunteer.status == "joined", 1), else_=0)), 0).label("joined_count"),
                func.coalesce(func.sum(case((EventVolunteer.status == "left", 1), else_=0)), 0).label("left_count"),
            )
            .join(Volunteer, Volunteer.id == EventVolunteer.volunteer_id)
            .join(UserProfile, UserProfile.user_id == Volunteer.user_id, isouter=True)
            .join(VolunteerRole, VolunteerRole.id == Volunteer.volunteer_role_id, isouter=True)
            .group_by(
                EventVolunteer.volunteer_id,
                Volunteer.user_id,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                VolunteerRole.name,
            )
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            VolunteerPerformance(
                volunteer_id=row.volunteer_id,
                user_id=row.user_id,
                first_name=row.first_name,
                last_name=row.last_name,
                alias=row.alias,
                role_name=row.role_name,
                joined_count=row.joined_count,
                left_count=row.left_count,
            )
            for row in rows
        ]

    async def get_organizer_output(self) -> list[OrganizerOutput]:
        stmt = (
            select(
                Event.created_by.label("organizer_id"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                func.count(Event.id).label("total_events"),
                func.avg(select(func.count(EventSession.id)).where(EventSession.event_id == Event.id).correlate(Event).scalar_subquery()).label(
                    "avg_sessions"
                ),
            )
            .join(UserProfile, UserProfile.user_id == Event.created_by, isouter=True)
            .group_by(Event.created_by, UserProfile.first_name, UserProfile.last_name, UserProfile.alias)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        output: list[OrganizerOutput] = []
        for row in rows:
            # Calculate average attendance rate per organizer
            attendance_sub = (
                select(
                    func.avg(
                        case(
                            (
                                func.count(EventParticipant.id) > 0,
                                func.sum(case((EventParticipant.status == "attended", 1), else_=0)).cast(float)
                                / func.count(EventParticipant.id).cast(float)
                                * 100,
                            ),
                            else_=None,
                        )
                    )
                )
                .select_from(EventSession)
                .join(EventParticipant, EventParticipant.event_session_id == EventSession.id, isouter=True)
                .where(EventSession.event_id == Event.id)
                .correlate(Event)
                .scalar_subquery()
            )

            avg_attendance_stmt = select(func.avg(attendance_sub)).where(Event.created_by == row.organizer_id)
            avg_attendance_result = await self.db.execute(avg_attendance_stmt)
            avg_attendance = avg_attendance_result.scalar()

            output.append(
                OrganizerOutput(
                    organizer_id=row.organizer_id,
                    first_name=row.first_name,
                    last_name=row.last_name,
                    alias=row.alias,
                    total_events_created=row.total_events,
                    average_sessions_per_event=round(float(row.avg_sessions), 2) if row.avg_sessions else None,
                    average_attendance_rate_pct=round(float(avg_attendance), 2) if avg_attendance else None,
                )
            )
        return output

    async def get_session_status_distribution(self) -> list[SessionStatusDistribution]:
        stmt = select(
            EventSession.status,
            func.count(EventSession.id).label("count"),
        ).group_by(EventSession.status)
        result = await self.db.execute(stmt)
        rows = result.all()

        return [SessionStatusDistribution(status=row.status, count=row.count) for row in rows]

    async def get_repeat_attendee_rate(self) -> float | None:
        sub = (
            select(
                EventParticipant.user_id,
                func.count(func.distinct(EventSession.event_id)).label("event_count"),
            )
            .join(EventSession, EventSession.id == EventParticipant.event_session_id)
            .where(EventParticipant.status == "attended")
            .group_by(EventParticipant.user_id)
            .subquery()
        )

        total_stmt = select(func.count(func.distinct(sub.c.user_id)))
        total = (await self.db.execute(total_stmt)).scalar() or 0

        repeat_stmt = select(func.count(func.distinct(sub.c.user_id))).where(sub.c.event_count > 1)
        repeat = (await self.db.execute(repeat_stmt)).scalar() or 0

        if total == 0:
            return None
        return round(repeat / total * 100, 2)

    async def get_average_registration_to_checkin_lead_time(self) -> float | None:
        stmt = select(func.avg(func.extract("epoch", EventParticipant.checked_in_time - EventParticipant.created_at) / 3600)).where(
            EventParticipant.is_checked_in.is_(True),
            EventParticipant.checked_in_time.isnot(None),
            EventParticipant.created_at.isnot(None),
        )
        result = await self.db.execute(stmt)
        avg_hours = result.scalar()
        return round(float(avg_hours), 2) if avg_hours else None

    async def get_live_attendance(self) -> list[LiveAttendance]:
        stmt = (
            select(
                EventSession.id.label("session_id"),
                EventSession.title.label("session_title"),
                EventSession.event_id,
                EventSession.max_slots,
                Event.title.label("event_title"),
                func.sum(case((EventParticipant.is_checked_in.is_(True), 1), else_=0)).label("checked_in_count"),
            )
            .join(Event, Event.id == EventSession.event_id)
            .join(EventParticipant, EventParticipant.event_session_id == EventSession.id, isouter=True)
            .where(EventSession.status == "started")
            .group_by(EventSession.id, EventSession.title, EventSession.event_id, EventSession.max_slots, Event.title)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            LiveAttendance(
                session_id=row.session_id,
                session_title=row.session_title,
                event_id=row.event_id,
                event_title=row.event_title,
                checked_in_count=row.checked_in_count,
                max_slots=row.max_slots,
                remaining_slots=row.max_slots - row.checked_in_count if row.max_slots is not None else None,
            )
            for row in rows
        ]

    async def get_year_over_year_attendance(self) -> list[YearOverYearAttendance]:
        stmt = (
            select(
                func.extract("year", Event.end_date).label("year"),
                func.count(func.distinct(EventParticipant.id)).label("attended_count"),
            )
            .join(EventSession, EventSession.event_id == Event.id)
            .join(EventParticipant, EventParticipant.event_session_id == EventSession.id)
            .where(
                EventParticipant.status == "attended",
                Event.status == "ended",
            )
            .group_by(func.extract("year", Event.end_date))
            .order_by(func.extract("year", Event.end_date))
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        output: list[YearOverYearAttendance] = []
        prev_count = 0
        for row in rows:
            year_int = int(row.year)
            growth = None
            if prev_count > 0:
                growth = round((row.attended_count - prev_count) / prev_count * 100, 2)
            elif prev_count == 0 and row.attended_count > 0:
                growth = None
            output.append(
                YearOverYearAttendance(
                    year=year_int,
                    attended_count=row.attended_count,
                    growth_pct=growth,
                )
            )
            prev_count = row.attended_count
        return output

    async def get_events_by_status_over_time(self) -> list[EventStatusTransition]:
        stmt = (
            select(
                func.to_char(Event.end_date, "YYYY-MM").label("period"),
                Event.status,
                func.count(Event.id).label("count"),
            )
            .where(Event.status.in_(["ended", "cancelled"]))
            .group_by(func.to_char(Event.end_date, "YYYY-MM"), Event.status)
            .order_by(func.to_char(Event.end_date, "YYYY-MM"))
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [EventStatusTransition(period=row.period, status=row.status, count=row.count) for row in rows]

    # ── Demographics ───────────────────────────────────────────────────

    async def get_device_breakdown(self) -> list[DeviceBreakdown]:
        total_stmt = select(func.count(UserLoginHistory.id)).where(UserLoginHistory.device_type.isnot(None))
        total = (await self.db.execute(total_stmt)).scalar() or 1

        stmt = (
            select(
                UserLoginHistory.device_type,
                func.count(UserLoginHistory.id).label("count"),
            )
            .where(UserLoginHistory.device_type.isnot(None))
            .group_by(UserLoginHistory.device_type)
            .order_by(func.count(UserLoginHistory.id).desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            DeviceBreakdown(
                device_type=row.device_type or "unknown",
                count=row.count,
                percentage=round(row.count / total * 100, 2),
            )
            for row in rows
        ]

    async def get_os_breakdown(self) -> list[OsBreakdown]:
        total_stmt = select(func.count(UserLoginHistory.id)).where(UserLoginHistory.os.isnot(None))
        total = (await self.db.execute(total_stmt)).scalar() or 1

        stmt = (
            select(
                UserLoginHistory.os,
                func.count(UserLoginHistory.id).label("count"),
            )
            .where(UserLoginHistory.os.isnot(None))
            .group_by(UserLoginHistory.os)
            .order_by(func.count(UserLoginHistory.id).desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            OsBreakdown(
                os=row.os or "unknown",
                count=row.count,
                percentage=round(row.count / total * 100, 2),
            )
            for row in rows
        ]

    async def get_browser_breakdown(self) -> list[BrowserBreakdown]:
        total_stmt = select(func.count(UserLoginHistory.id)).where(UserLoginHistory.browser.isnot(None))
        total = (await self.db.execute(total_stmt)).scalar() or 1

        stmt = (
            select(
                UserLoginHistory.browser,
                func.count(UserLoginHistory.id).label("count"),
            )
            .where(UserLoginHistory.browser.isnot(None))
            .group_by(UserLoginHistory.browser)
            .order_by(func.count(UserLoginHistory.id).desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            BrowserBreakdown(
                browser=row.browser or "unknown",
                count=row.count,
                percentage=round(row.count / total * 100, 2),
            )
            for row in rows
        ]

    async def get_top_participating_cities(self, limit: int) -> list[CityParticipation]:
        sub = (
            select(func.distinct(EventParticipant.user_id).label("user_id"), Venue.city, Venue.country)
            .join(EventSession, EventSession.id == EventParticipant.event_session_id)
            .join(Venue, Venue.id == EventSession.venue_id)
            .where(EventParticipant.status.in_(["attended", "registered"]))
        ).subquery()

        stmt = (
            select(
                sub.c.city,
                sub.c.country,
                func.count(sub.c.user_id).label("participant_count"),
            )
            .group_by(sub.c.city, sub.c.country)
            .order_by(func.count(sub.c.user_id).desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            CityParticipation(
                city=row.city,
                country=row.country,
                participant_count=row.participant_count,
            )
            for row in rows
        ]

    async def get_account_age_distribution(self) -> list[AccountAgeDistribution]:
        now = _now()

        users_stmt = select(User.created_at).where(User.deleted_at.is_(None))
        result = await self.db.execute(users_stmt)
        created_ats = [row[0] for row in result.all()]

        buckets = {"<30 days": 0, "1-6 months": 0, "6-12 months": 0, "1-2 years": 0, "2+ years": 0}
        total = len(created_ats)

        for created_at in created_ats:
            if created_at is None:
                continue
            age = now - created_at.replace(tzinfo=UTC)
            if age < timedelta(days=30):
                buckets["<30 days"] += 1
            elif age < timedelta(days=180):
                buckets["1-6 months"] += 1
            elif age < timedelta(days=365):
                buckets["6-12 months"] += 1
            elif age < timedelta(days=730):
                buckets["1-2 years"] += 1
            else:
                buckets["2+ years"] += 1

        return [
            AccountAgeDistribution(
                bucket=bucket,
                count=count,
                percentage=round(count / total * 100, 2) if total > 0 else None,
            )
            for bucket, count in buckets.items()
        ]

    async def get_volunteer_role_breakdown(self) -> list[VolunteerRoleBreakdown]:
        stmt = (
            select(
                VolunteerRole.name.label("role_name"),
                func.count(Volunteer.id).label("count"),
            )
            .join(Volunteer, Volunteer.volunteer_role_id == VolunteerRole.id)
            .where(Volunteer.status == "active")
            .group_by(VolunteerRole.name)
            .order_by(func.count(Volunteer.id).desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [VolunteerRoleBreakdown(role_name=row.role_name, count=row.count) for row in rows]

    async def get_event_interest_categories(self) -> list[EventInterestCategory]:
        # Events don't have explicit tags, so we group by event title as a proxy
        # Also check banner_url presence as a proxy for "promoted" events
        stmt = (
            select(
                Event.id.label("event_id"),
                Event.title,
                func.count(func.distinct(EventParticipant.user_id)).label("registration_count"),
            )
            .join(EventSession, EventSession.event_id == Event.id)
            .join(EventParticipant, EventParticipant.event_session_id == EventSession.id)
            .where(Event.status.in_(["ended", "started", "posted"]))
            .group_by(Event.id, Event.title)
            .order_by(func.count(func.distinct(EventParticipant.user_id)).desc())
            .limit(20)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            EventInterestCategory(
                category=row.title,
                event_count=1,
                registration_count=row.registration_count,
            )
            for row in rows
        ]

    async def get_first_time_vs_returning(self) -> list[FirstTimeVsReturning]:
        # For each ended/started event, count first-time vs returning attendees
        # A "first-time attendee" is someone whose first attended event is this one
        events_stmt = select(Event.id, Event.title).where(Event.status.in_(["ended", "started"]))
        events_result = await self.db.execute(events_stmt)
        events = events_result.all()

        # Get all attended event_ids per user, ordered by event end_date
        attended_stmt = (
            select(
                EventParticipant.user_id,
                Event.id.label("event_id"),
                Event.end_date,
            )
            .join(EventSession, EventSession.id == EventParticipant.event_session_id)
            .join(Event, Event.id == EventSession.event_id)
            .where(EventParticipant.status == "attended")
            .order_by(EventParticipant.user_id, Event.end_date)
        )
        attended_result = await self.db.execute(attended_stmt)
        attended_rows = attended_result.all()

        # Build per-user first event
        user_first_event: dict[uuid.UUID, uuid.UUID] = {}
        for row in attended_rows:
            if row.user_id not in user_first_event:
                user_first_event[row.user_id] = row.event_id

        output: list[FirstTimeVsReturning] = []
        for event_row in events:
            first_time = 0
            returning = 0
            for user_id, first_event_id in user_first_event.items():
                # Check if user attended this event
                user_events = [r.event_id for r in attended_rows if r.user_id == user_id]
                if event_row.id in user_events:
                    if first_event_id == event_row.id:
                        first_time += 1
                    else:
                        returning += 1
            if first_time > 0 or returning > 0:
                output.append(
                    FirstTimeVsReturning(
                        event_id=event_row.id,
                        event_title=event_row.title,
                        first_time_count=first_time,
                        returning_count=returning,
                    )
                )

        return output

    async def get_gender_distribution(self) -> list[GenderDistribution]:
        sub = (
            select(func.distinct(EventParticipant.user_id).label("user_id"))
            .join(EventSession, EventSession.id == EventParticipant.event_session_id)
            .where(EventParticipant.status.in_(["attended", "registered"]))
        ).subquery()

        total_stmt = select(func.count()).select_from(sub)
        total = (await self.db.execute(total_stmt)).scalar() or 1

        stmt = (
            select(
                UserProfile.gender,
                func.count(UserProfile.user_id).label("count"),
            )
            .join(sub, sub.c.user_id == UserProfile.user_id)
            .group_by(UserProfile.gender)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            GenderDistribution(
                gender=row.gender,
                count=row.count,
                percentage=round(row.count / total * 100, 2),
            )
            for row in rows
        ]

    async def get_geographic_spread(self) -> list[GeographicSpread]:
        stmt = (
            select(
                Venue.city,
                func.count(func.distinct(EventParticipant.user_id)).label("participant_count"),
            )
            .join(EventSession, EventSession.venue_id == Venue.id)
            .join(EventParticipant, EventParticipant.event_session_id == EventSession.id)
            .where(EventParticipant.status.in_(["attended"]))
            .group_by(Venue.city)
            .order_by(func.count(func.distinct(EventParticipant.user_id)).desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            GeographicSpread(
                city=row.city,
                latitude=None,
                longitude=None,
                participant_count=row.participant_count,
            )
            for row in rows
        ]

    # ── On-going ───────────────────────────────────────────────────────

    async def get_started_events(self) -> list[StartedEventSummary]:
        stmt = select(Event.id, Event.title).where(Event.status == "started")
        result = await self.db.execute(stmt)
        events = result.all()

        output: list[StartedEventSummary] = []
        for event_row in events:
            sessions_stmt = select(EventSession.id, EventSession.max_slots).where(
                EventSession.event_id == event_row.id, EventSession.status == "started"
            )
            sessions_result = await self.db.execute(sessions_stmt)
            sessions = sessions_result.all()

            total_checked_in = 0
            total_remaining = 0
            for sess in sessions:
                checked_in_stmt = select(func.count(EventParticipant.id)).where(
                    EventParticipant.event_session_id == sess.id,
                    EventParticipant.is_checked_in.is_(True),
                )
                ci = (await self.db.execute(checked_in_stmt)).scalar() or 0
                total_checked_in += ci
                if sess.max_slots is not None:
                    total_remaining += max(0, sess.max_slots - ci)

            output.append(
                StartedEventSummary(
                    event_id=event_row.id,
                    event_title=event_row.title,
                    session_count=len(sessions),
                    checked_in_count=total_checked_in,
                    remaining_slots=total_remaining if total_remaining > 0 else None,
                )
            )

        return output

    async def get_live_checkin_feed(self, limit: int) -> list[LiveCheckinEntry]:
        stmt = (
            select(
                EventParticipant.id.label("participant_id"),
                EventParticipant.user_id,
                EventParticipant.event_session_id,
                EventParticipant.checked_in_time,
                EventParticipant.checked_in_by,
                EventSession.title.label("session_title"),
                EventSession.event_id,
                Event.title.label("event_title"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
            )
            .join(EventSession, EventSession.id == EventParticipant.event_session_id)
            .join(Event, Event.id == EventSession.event_id)
            .join(UserProfile, UserProfile.user_id == EventParticipant.user_id, isouter=True)
            .where(
                EventSession.status == "started",
                EventParticipant.is_checked_in.is_(True),
                EventParticipant.checked_in_time.isnot(None),
            )
            .order_by(EventParticipant.checked_in_time.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            LiveCheckinEntry(
                participant_id=row.participant_id,
                user_id=row.user_id,
                first_name=row.first_name,
                last_name=row.last_name,
                alias=row.alias,
                session_id=row.event_session_id,
                session_title=row.session_title,
                event_id=row.event_id,
                event_title=row.event_title,
                checked_in_time=row.checked_in_time,
                checkin_method="manual" if row.checked_in_by is None else "qr",
            )
            for row in rows
        ]

    async def get_volunteer_on_duty(self) -> list[VolunteerOnDuty]:
        stmt = (
            select(
                EventVolunteer.volunteer_id,
                Volunteer.user_id,
                Volunteer.contact_phone,
                VolunteerRole.name.label("role_name"),
                EventVolunteer.event_id,
                Event.title.label("event_title"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
            )
            .join(Volunteer, Volunteer.id == EventVolunteer.volunteer_id)
            .join(VolunteerRole, VolunteerRole.id == Volunteer.volunteer_role_id, isouter=True)
            .join(Event, Event.id == EventVolunteer.event_id)
            .join(UserProfile, UserProfile.user_id == Volunteer.user_id, isouter=True)
            .where(
                EventVolunteer.status == "joined",
                Event.status == "started",
            )
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            VolunteerOnDuty(
                volunteer_id=row.volunteer_id,
                user_id=row.user_id,
                first_name=row.first_name,
                last_name=row.last_name,
                alias=row.alias,
                contact_phone=row.contact_phone,
                role_name=row.role_name,
                event_id=row.event_id,
                event_title=row.event_title,
            )
            for row in rows
        ]

    async def get_session_progress(self) -> list[SessionProgress]:
        now = _now()

        stmt = (
            select(
                EventSession.id.label("session_id"),
                EventSession.title.label("session_title"),
                EventSession.event_id,
                EventSession.start_datetime,
                EventSession.end_datetime,
                Event.title.label("event_title"),
            )
            .join(Event, Event.id == EventSession.event_id)
            .where(EventSession.status == "started")
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        output: list[SessionProgress] = []
        for row in rows:
            total_duration = (row.end_datetime - row.start_datetime).total_seconds()
            elapsed = (now - row.start_datetime).total_seconds()
            pct = min(100, max(0, round(elapsed / total_duration * 100, 1))) if total_duration > 0 else 100.0

            output.append(
                SessionProgress(
                    session_id=row.session_id,
                    session_title=row.session_title,
                    event_id=row.event_id,
                    event_title=row.event_title,
                    start_datetime=row.start_datetime,
                    end_datetime=row.end_datetime,
                    elapsed_pct=pct,
                )
            )

        return output

    async def get_pending_withdrawals(self) -> list[PendingWithdrawalAlert]:
        # Participants who cancelled after session started
        stmt = (
            select(
                EventSession.id.label("session_id"),
                EventSession.title.label("session_title"),
                EventSession.event_id,
                func.count(EventParticipant.id).label("withdrawal_count"),
            )
            .join(EventParticipant, EventParticipant.event_session_id == EventSession.id)
            .where(
                EventSession.status == "started",
                EventParticipant.status == "cancelled",
            )
            .group_by(EventSession.id, EventSession.title, EventSession.event_id)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            PendingWithdrawalAlert(
                session_id=row.session_id,
                session_title=row.session_title,
                event_id=row.event_id,
                withdrawal_count=row.withdrawal_count,
            )
            for row in rows
        ]

    async def get_late_registrations(self) -> list[LateRegistration]:
        stmt = (
            select(
                EventParticipant.id.label("participant_id"),
                EventParticipant.user_id,
                EventParticipant.event_session_id,
                EventParticipant.created_at.label("registered_at"),
                EventSession.title.label("session_title"),
                EventSession.event_id,
                EventSession.start_datetime,
                Event.title.label("event_title"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
            )
            .join(EventSession, EventSession.id == EventParticipant.event_session_id)
            .join(Event, Event.id == EventSession.event_id)
            .join(UserProfile, UserProfile.user_id == EventParticipant.user_id, isouter=True)
            .where(
                EventSession.status == "started",
                EventParticipant.created_at > EventSession.start_datetime,
            )
            .order_by(EventParticipant.created_at.desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            LateRegistration(
                participant_id=row.participant_id,
                user_id=row.user_id,
                first_name=row.first_name,
                last_name=row.last_name,
                alias=row.alias,
                session_id=row.event_session_id,
                session_title=row.session_title,
                event_id=row.event_id,
                registered_at=row.registered_at,
                session_started_at=row.start_datetime,
            )
            for row in rows
        ]

    # ── Historical ─────────────────────────────────────────────────────

    async def get_ended_events(
        self,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
        organizer_id: uuid.UUID | None = None,
        venue_id: uuid.UUID | None = None,
    ) -> list[EndedEventSummary]:
        stmt = select(Event).where(Event.status == "ended")

        if from_date:
            stmt = stmt.where(Event.start_date >= from_date)
        if to_date:
            stmt = stmt.where(Event.end_date <= to_date)
        if organizer_id:
            stmt = stmt.where(Event.created_by == organizer_id)

        if venue_id:
            venue_event_ids = select(func.distinct(EventSession.event_id)).where(EventSession.venue_id == venue_id)
            stmt = stmt.where(Event.id.in_(venue_event_ids))

        stmt = stmt.order_by(Event.end_date.desc())
        result = await self.db.execute(stmt)
        events = result.scalars().all()

        output: list[EndedEventSummary] = []
        for event in events:
            sessions_stmt = select(EventSession.id).where(EventSession.event_id == event.id)
            sessions_result = await self.db.execute(sessions_stmt)
            session_ids = [r[0] for r in sessions_result.all()]

            if not session_ids:
                registered = attended = no_show = cancelled = 0
            else:
                registered_stmt = select(func.count(EventParticipant.id)).where(EventParticipant.event_session_id.in_(session_ids))
                registered = (await self.db.execute(registered_stmt)).scalar() or 0

                attended_stmt = select(func.count(EventParticipant.id)).where(
                    EventParticipant.event_session_id.in_(session_ids),
                    EventParticipant.status == "attended",
                )
                attended = (await self.db.execute(attended_stmt)).scalar() or 0

                no_show_stmt = select(func.count(EventParticipant.id)).where(
                    EventParticipant.event_session_id.in_(session_ids),
                    EventParticipant.status == "no_show",
                )
                no_show = (await self.db.execute(no_show_stmt)).scalar() or 0

                cancelled_stmt = select(func.count(EventParticipant.id)).where(
                    EventParticipant.event_session_id.in_(session_ids),
                    EventParticipant.status == "cancelled",
                )
                cancelled = (await self.db.execute(cancelled_stmt)).scalar() or 0

            avg_feedback_stmt = select(func.avg(EventFeedback.rating)).where(EventFeedback.event_id == event.id)
            avg_feedback = (await self.db.execute(avg_feedback_stmt)).scalar()

            output.append(
                EndedEventSummary(
                    event_id=event.id,
                    event_title=event.title,
                    start_date=event.start_date,
                    end_date=event.end_date,
                    total_registered=registered,
                    total_attended=attended,
                    total_no_show=no_show,
                    total_cancelled=cancelled,
                    average_feedback=round(float(avg_feedback), 2) if avg_feedback else None,
                )
            )

        return output

    async def get_cancelled_events_report(self) -> list[CancelledEventReport]:
        stmt = (
            select(
                Event.id.label("event_id"),
                Event.title.label("event_title"),
                Event.created_by,
                Event.updated_at.label("cancelled_at"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
            )
            .join(UserProfile, UserProfile.user_id == Event.created_by, isouter=True)
            .where(Event.status == "cancelled")
            .order_by(Event.updated_at.desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        output: list[CancelledEventReport] = []
        for row in rows:
            session_count_stmt = select(func.count(EventSession.id)).where(EventSession.event_id == row.event_id)
            session_count = (await self.db.execute(session_count_stmt)).scalar() or 0

            output.append(
                CancelledEventReport(
                    event_id=row.event_id,
                    event_title=row.event_title,
                    cancelled_at=row.cancelled_at,
                    created_by=row.created_by,
                    creator_first_name=row.first_name,
                    creator_last_name=row.last_name,
                    creator_alias=row.alias,
                    session_count=session_count,
                )
            )

        return output

    async def get_feedback_completeness(self) -> list[FeedbackCompleteness]:
        stmt = select(Event.id, Event.title).where(Event.status == "ended")
        result = await self.db.execute(stmt)
        events = result.all()

        output: list[FeedbackCompleteness] = []
        for event_row in events:
            attended_stmt = (
                select(func.count(EventParticipant.id))
                .join(EventSession, EventSession.id == EventParticipant.event_session_id)
                .where(
                    EventSession.event_id == event_row.id,
                    EventParticipant.status == "attended",
                )
            )
            attended = (await self.db.execute(attended_stmt)).scalar() or 0

            feedback_stmt = select(func.count(EventFeedback.id)).where(EventFeedback.event_id == event_row.id)
            feedback_count = (await self.db.execute(feedback_stmt)).scalar() or 0

            completeness = None
            if attended > 0:
                completeness = round(feedback_count / attended * 100, 2)

            output.append(
                FeedbackCompleteness(
                    event_id=event_row.id,
                    event_title=event_row.title,
                    attended_count=attended,
                    feedback_count=feedback_count,
                    completeness_rate_pct=completeness,
                )
            )

        return output
