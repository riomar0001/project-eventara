class EventRatingNotFoundError(Exception):
    """Raised when an event rating is not found."""

    def __init__(self, rating_id: str = "") -> None:
        msg = f"Event rating not found: {rating_id}" if rating_id else "Event rating not found"
        super().__init__(msg)


class EventRatingValidationError(Exception):
    """Raised when event rating data fails validation."""

    def __init__(self, message: str) -> None:
        super().__init__(f"Event rating validation failed: {message}")


class DuplicateEventRatingError(Exception):
    """Raised when a user attempts to rate the same event twice."""

    def __init__(self, user_id: str = "", event_id: str = "") -> None:
        if user_id and event_id:
            msg = f"User {user_id} has already rated event {event_id}"
        else:
            msg = "User has already rated this event"
        super().__init__(msg)


class UnauthorizedEventRatingOperationError(Exception):
    """Raised when user lacks permission for rating operation."""

    def __init__(self, rating_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on event rating: {rating_id}"
            if rating_id
            else "You do not have permission to perform this operation on this event rating"
        )
        super().__init__(msg)


class EventNotRatableError(Exception):
    """Raised when attempting to rate an event that cannot be rated."""

    def __init__(self, reason: str = "") -> None:
        msg = f"Event cannot be rated: {reason}" if reason else "Event cannot be rated"
        super().__init__(msg)
