class EventParticipantNotFoundError(Exception):
    """Raised when an event participant is not found."""

    def __init__(self, participant_id: str = "") -> None:
        msg = f"Event participant not found: {participant_id}" if participant_id else "Event participant not found"
        super().__init__(msg)


class EventParticipantValidationError(Exception):
    """Raised when event participant data fails validation."""

    def __init__(self, message: str) -> None:
        super().__init__(f"Event participant validation failed: {message}")


class DuplicateEventParticipantError(Exception):
    """Raised when a user attempts to register for the same session twice."""

    def __init__(self, user_id: str = "", session_id: str = "") -> None:
        if user_id and session_id:
            msg = f"User {user_id} is already registered for event session {session_id}"
        else:
            msg = "User is already registered for this event session"
        super().__init__(msg)


class UnauthorizedEventParticipantOperationError(Exception):
    """Raised when user lacks permission for participant operation."""

    def __init__(self, participant_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on event participant: {participant_id}"
            if participant_id
            else "You do not have permission to perform this operation on this event participant"
        )
        super().__init__(msg)


class InvalidEventParticipantStatusTransitionError(Exception):
    """Raised when an invalid status transition is attempted."""

    def __init__(
        self,
        participant_id: str = "",
        from_status: str = "",
        to_status: str = "",
    ) -> None:
        if participant_id and from_status and to_status:
            msg = f"Cannot transition event participant {participant_id} from {from_status} to {to_status}"
        else:
            msg = "Invalid event participant status transition"
        super().__init__(msg)
