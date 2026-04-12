class VenueRatingNotFoundError(Exception):
    def __init__(self, rating_id: str = "") -> None:
        super().__init__(f"Venue rating not found: {rating_id}" if rating_id else "Venue rating not found")


class VenueRatingValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Venue rating validation failed: {message}")


class VenueRatingAlreadyExistsError(Exception):
    def __init__(self, user_id: str = "", venue_id: str = "") -> None:
        if user_id and venue_id:
            super().__init__(f"User {user_id} has already rated venue {venue_id}")
        else:
            super().__init__("User has already rated this venue")


class UnauthorizedRatingOperationError(Exception):
    def __init__(self, rating_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on rating: {rating_id}"
            if rating_id
            else "You do not have permission to perform this operation on this rating"
        )
        super().__init__(msg)
