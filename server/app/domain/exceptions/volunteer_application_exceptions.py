class VolunteerApplicationNotFoundError(Exception):
    def __init__(self, application_id: str = "") -> None:
        super().__init__(f"Volunteer application not found: {application_id}" if application_id else "Volunteer application not found")


class VolunteerApplicationAlreadyExistsError(Exception):
    def __init__(self, user_id: str = "") -> None:
        super().__init__(
            f"An active volunteer application already exists for user: {user_id}" if user_id else "An active volunteer application already exists"
        )


class InvalidApplicationStatusTransitionError(Exception):
    def __init__(self, application_id: str = "", from_status: str = "", to_status: str = "") -> None:
        if application_id and from_status and to_status:
            msg = f"Cannot transition application {application_id} from '{from_status}' to '{to_status}'"
        else:
            msg = "Invalid application status transition"
        super().__init__(msg)


class UnauthorizedApplicationOperationError(Exception):
    def __init__(self, application_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on application: {application_id}"
            if application_id
            else "You do not have permission to perform this operation on this application"
        )
        super().__init__(msg)


class ApplicationStatusError(Exception):
    def __init__(self, message: str = "") -> None:
        super().__init__(message if message else "Application is not in the required status")


class VolunteerApplicationValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Volunteer application validation failed: {message}")
