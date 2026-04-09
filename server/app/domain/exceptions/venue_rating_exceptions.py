class VenueRatingNotFoundError(Exception):
    def __init__(self, rating_id: str = "") -> None:
        super().__init__(f"Venue rating not found: {rating_id}" if rating_id else "Venue rating not found")


class RatingAlreadyExistsError(Exception):
    def __init__(self, user_id: str = "", venue_id: str = "") -> None:
        super().__init__(
            f"User {user_id} has already rated venue {venue_id}"
            if user_id and venue_id
            else "User has already rated this venue"
        )

class InvalidRatingError(Exception):
    def __init__(self, message: str = "Rating must be between 1 and 5") -> None:
        super().__init__(message)