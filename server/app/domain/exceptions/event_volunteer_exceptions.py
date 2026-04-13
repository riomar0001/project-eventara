class EventVolunteerNotFoundError(Exception):
    def __init__(self, event_volunteer_id: str = "") -> None:
        super().__init__(f"Event volunteer not found: {event_volunteer_id}" if event_volunteer_id else "Event volunteer not found")


class EventVolunteerValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Event volunteer validation failed: {message}")


class EventVolunteerAlreadyExistsError(Exception):
    def __init__(self, volunteer_id: str = "", event_id: str = "") -> None:
        if volunteer_id and event_id:
            msg = f"Volunteer {volunteer_id} is already registered for event {event_id}"
        else:
            msg = "Event volunteer already exists"
        super().__init__(msg)


class UnauthorizedEventVolunteerOperationError(Exception):
    def __init__(self, event_volunteer_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on event volunteer: {event_volunteer_id}"
            if event_volunteer_id
            else "You do not have permission to perform this operation on this event volunteer"
        )
        super().__init__(msg)


class InvalidEventVolunteerStatusTransitionError(Exception):
    def __init__(self, event_volunteer_id: str = "", from_status: str = "", to_status: str = "") -> None:
        if event_volunteer_id and from_status and to_status:
            msg = f"Cannot transition event volunteer {event_volunteer_id} from {from_status} to {to_status}"
        else:
            msg = "Invalid event volunteer status transition"
        super().__init__(msg)
