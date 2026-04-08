class VenueNotFoundError(Exception):
    def __init__(self, venue_id: str = "") -> None:
        super().__init__(f"Venue not found: {venue_id}" if venue_id else "Venue not found")


class UnauthorizedVenueOperationError(Exception):
    def __init__(self, venue_id: str = "") -> None:
        super().__init__(
            f"You do not have permission to access this venue: {venue_id}" 
            if venue_id 
            else "You do not have permission to access this venue"
        )


class VenueValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Venue validation failed: {message}")