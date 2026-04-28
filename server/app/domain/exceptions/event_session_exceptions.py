class EventSessionNotFoundError(Exception):
    def __init__(self, session_id: str = "") -> None:
        msg = f"Event session not found: {session_id}" if session_id else "Event session not found"
        super().__init__(msg)


class EventSessionValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Event session validation failed: {message}")


class InvalidEventSessionDateError(Exception):
    def __init__(self, start_date: str = "", end_date: str = "") -> None:
        if start_date and end_date:
            msg = f"Invalid session dates: end_datetime ({end_date}) cannot be before start_datetime ({start_date})"
        else:
            msg = "Invalid session dates: end_datetime cannot be before start_datetime"
        super().__init__(msg)


class EventSessionExceedsEventBoundsError(Exception):
    def __init__(
        self,
        session_start: str = "",
        session_end: str = "",
        event_start: str = "",
        event_end: str = "",
    ) -> None:
        if all([session_start, session_end, event_start, event_end]):
            msg = f"Session window [{session_start} – {session_end}] falls outside the event window [{event_start} – {event_end}]"
        else:
            msg = "Session dates must fall within the event date range"
        super().__init__(msg)


class EventSessionStatusTransitionError(Exception):
    def __init__(self, from_status: str = "", to_status: str = "") -> None:
        if from_status and to_status:
            msg = f"Cannot transition event session from {from_status} to {to_status}"
        else:
            msg = "Invalid event session status transition"
        super().__init__(msg)


class UnauthorizedEventSessionOperationError(Exception):
    def __init__(self, session_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on event session: {session_id}"
            if session_id
            else "You do not have permission to perform this operation on this event session"
        )
        super().__init__(msg)


class EventSessionDeletionNotAllowedError(Exception):
    def __init__(self, session_id: str = "", current_status: str = "") -> None:
        if session_id and current_status:
            msg = f"Event session {session_id} cannot be deleted while in status: {current_status}"
        else:
            msg = "Event session cannot be deleted in its current status"
        super().__init__(msg)


class EventLastSessionError(Exception):
    def __init__(self, event_id: str = "") -> None:
        msg = (
            f"Cannot delete the only remaining session for event: {event_id}"
            if event_id
            else "Cannot delete the only remaining session for this event"
        )
        super().__init__(msg)
