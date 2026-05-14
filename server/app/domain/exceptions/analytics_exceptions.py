"""Analytics domain exceptions."""


class AnalyticsError(Exception):
    """Base exception for analytics domain errors."""


class AnalyticsDataFetchError(AnalyticsError):
    """Raised when an analytics repository query fails."""


class EventNotFoundError(AnalyticsError):
    """Raised when a requested event does not exist."""


class InvalidDateRangeError(AnalyticsError):
    """Raised when the provided date range is invalid (e.g. from_date > to_date)."""
