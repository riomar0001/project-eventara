class EventNotFoundError(Exception):
    def __init__(self, event_id: str = "") -> None:
        super().__init__(f"Event not found: {event_id}" if event_id else "Event not found")


class EventValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Event validation failed: {message}")


class UnauthorizedEventOperationError(Exception):
    def __init__(self, event_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on event: {event_id}"
            if event_id
            else "You do not have permission to perform this operation on this event"
        )
        super().__init__(msg)


class EventStatusTransitionError(Exception):
    def __init__(self, event_id: str = "", from_status: str = "", to_status: str = "") -> None:
        if event_id and from_status and to_status:
            msg = f"Cannot transition event {event_id} from {from_status} to {to_status}"
        else:
            msg = "Invalid event status transition"
        super().__init__(msg)


class EventDateValidationError(Exception):
    def __init__(self, message: str = "") -> None:
        default_msg = "Event start date must be before end date"
        super().__init__(message if message else default_msg)
