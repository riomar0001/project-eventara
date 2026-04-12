class VolunteerNotFoundError(Exception):
    def __init__(self, volunteer_id: str = "") -> None:
        super().__init__(f"Volunteer not found: {volunteer_id}" if volunteer_id else "Volunteer not found")


class VolunteerValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Volunteer validation failed: {message}")


class VolunteerAlreadyExistsError(Exception):
    def __init__(self, user_id: str = "") -> None:
        super().__init__(f"Volunteer already exists for user: {user_id}" if user_id else "Volunteer already exists")


class UnauthorizedVolunteerOperationError(Exception):
    def __init__(self, volunteer_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on volunteer: {volunteer_id}"
            if volunteer_id
            else "You do not have permission to perform this operation on this volunteer"
        )
        super().__init__(msg)


class VolunteerInactiveError(Exception):
    def __init__(self, volunteer_id: str = "") -> None:
        super().__init__(f"Volunteer is inactive: {volunteer_id}" if volunteer_id else "Volunteer is inactive")
