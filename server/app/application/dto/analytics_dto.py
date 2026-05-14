"""Analytics DTOs — input/output data transfer objects for all five analytics domains."""

import uuid
from dataclasses import dataclass
from datetime import datetime

from app.domain.entities.analytics_entities import (
    DemographicAnalytics,
    EventLogisticsOverview,
    EventPerformance,
    HistoricalEventData,
    HistoricalPerformance,
    OngoingEventData,
    OngoingPerformance,
    RegistrationLogistics,
    SessionTimeline,
    VolunteerLogistics,
)

# ── Logistics ──────────────────────────────────────────────────────────

@dataclass
class GetEventLogisticsInput:
    event_id: uuid.UUID


@dataclass
class GetEventLogisticsOutput:
    overview: EventLogisticsOverview


@dataclass
class GetSessionTimelineInput:
    pass


@dataclass
class GetSessionTimelineOutput:
    timeline: SessionTimeline


@dataclass
class GetVolunteerLogisticsInput:
    event_id: uuid.UUID


@dataclass
class GetVolunteerLogisticsOutput:
    logistics: VolunteerLogistics


@dataclass
class GetRegistrationLogisticsInput:
    event_id: uuid.UUID


@dataclass
class GetRegistrationLogisticsOutput:
    registrations: list[RegistrationLogistics]


# ── Performance ────────────────────────────────────────────────────────

@dataclass
class GetEventPerformanceInput:
    event_id: uuid.UUID | None = None
    min_feedback_count: int = 3
    feedback_trend_limit: int = 12


@dataclass
class GetEventPerformanceOutput:
    performance: EventPerformance


@dataclass
class GetOngoingPerformanceInput:
    pass


@dataclass
class GetOngoingPerformanceOutput:
    performance: OngoingPerformance


@dataclass
class GetHistoricalPerformanceInput:
    pass


@dataclass
class GetHistoricalPerformanceOutput:
    performance: HistoricalPerformance


# ── Demographics ───────────────────────────────────────────────────────

@dataclass
class GetDemographicAnalyticsInput:
    top_cities_limit: int = 10


@dataclass
class GetDemographicAnalyticsOutput:
    demographics: DemographicAnalytics


# ── On-going ───────────────────────────────────────────────────────────

@dataclass
class GetOngoingEventDataInput:
    checkin_feed_limit: int = 50


@dataclass
class GetOngoingEventDataOutput:
    data: OngoingEventData


# ── Historical ─────────────────────────────────────────────────────────

@dataclass
class GetHistoricalEventDataInput:
    from_date: datetime | None = None
    to_date: datetime | None = None
    organizer_id: uuid.UUID | None = None
    venue_id: uuid.UUID | None = None
    compare_from_date: datetime | None = None
    compare_to_date: datetime | None = None


@dataclass
class GetHistoricalEventDataOutput:
    data: HistoricalEventData
