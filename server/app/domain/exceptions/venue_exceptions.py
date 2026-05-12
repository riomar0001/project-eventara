class VenueNotFoundError(Exception):
    def __init__(self, venue_id: str = "") -> None:
        super().__init__(f"Venue not found: {venue_id}" if venue_id else "Venue not found")


class VenueNotPartnerError(Exception):
    def __init__(self, venue_id: str = "") -> None:
        super().__init__(
            f"Only partner venues can be used for event sessions: {venue_id}"
            if venue_id
            else "Only partner venues can be used for event sessions"
        )


class VenueNotCommunitySuggestionError(Exception):
    def __init__(self, venue_id: str = "") -> None:
        super().__init__(
            f"Only community suggested venues can be managed through this endpoint: {venue_id}"
            if venue_id
            else "Only community suggested venues can be managed through this endpoint"
        )


class UnauthorizedVenueOperationError(Exception):
    def __init__(self, venue_id: str = "") -> None:
        super().__init__(
            f"You do not have permission to access this venue: {venue_id}" if venue_id else "You do not have permission to access this venue"
        )


class VenueValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Venue validation failed: {message}")


class VenueAlreadyExistsError(Exception):
    def __init__(self, name: str = "") -> None:
        super().__init__(f"Venue with this name already exists: {name}" if name else "Venue with this name already exists")


class VenueInvalidTypeError(Exception):
    def __init__(self, venue_type: str) -> None:
        super().__init__(f"Invalid venue type: {venue_type}")


class VenueInUseError(Exception):
    def __init__(self, venue_id: str = "") -> None:
        super().__init__(
            f"Venue cannot be deleted while event sessions still reference it: {venue_id}"
            if venue_id
            else "Venue cannot be deleted while event sessions still reference it."
        )
