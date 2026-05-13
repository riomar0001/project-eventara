from dataclasses import dataclass, field

from app.domain.entities.app_feedback_entity import AppFeedback
from app.domain.entities.dashboard_entity import UserRegistrationWeek


@dataclass
class SubmitAppFeedbackInput:
    rating: int
    comment: str | None = None
    ip_address: str | None = None


@dataclass
class SubmitAppFeedbackOutput:
    feedback: AppFeedback


@dataclass
class GetAppFeedbackInput:
    page: int = 1
    page_size: int = 20


@dataclass
class GetAppFeedbackOutput:
    feedback: list[AppFeedback]
    total: int
    page: int
    page_size: int


@dataclass
class GetUsersPerWeekInput:
    weeks: int = 12


@dataclass
class GetUsersPerWeekOutput:
    entries: list[UserRegistrationWeek]
