class EventSessionNotFoundError(Exception):
    """Raised when an event session is not found."""

    def __init__(self, session_id: str = "") -> None:
        msg = f"Event session not found: {session_id}" if session_id else "Event session not found"
        super().__init__(msg)


class EventSessionValidationError(Exception):
    """Raised when event session data fails validation."""

    def __init__(self, message: str) -> None:
        super().__init__(f"Event session validation failed: {message}")


class InvalidEventSessionDateError(Exception):
    """Raised when session dates are invalid (end before start)."""

    def __init__(self, start_date: str = "", end_date: str = "") -> None:
        if start_date and end_date:
            msg = f"Invalid session dates: end_datetime ({end_date}) cannot be before start_datetime ({start_date})"
        else:
            msg = "Invalid session dates: end_datetime cannot be before start_datetime"
        super().__init__(msg)


class EventSessionStatusTransitionError(Exception):
    """Raised when an invalid status transition is attempted."""

    def __init__(self, from_status: str = "", to_status: str = "") -> None:
        if from_status and to_status:
            msg = f"Cannot transition event session from {from_status} to {to_status}"
        else:
            msg = "Invalid event session status transition"
        super().__init__(msg)


class UnauthorizedEventSessionOperationError(Exception):
    """Raised when user lacks permission for session operation."""

    def __init__(self, session_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on event session: {session_id}"
            if session_id
            else "You do not have permission to perform this operation on this event session"
        )
        super().__init__(msg)
