class VolunteerApplicationNotFoundError(Exception):
    def __init__(self, application_id: str = "") -> None:
        super().__init__(f"Volunteer application not found: {application_id}" if application_id else "Volunteer application not found")


class VolunteerApplicationValidationError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(f"Volunteer application validation failed: {message}")


class VolunteerApplicationAlreadyExistsError(Exception):
    def __init__(self, user_id: str = "") -> None:
        super().__init__(f"Application already exists for user: {user_id}" if user_id else "Application already exists")


class UnauthorizedApplicationOperationError(Exception):
    def __init__(self, application_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on application: {application_id}"
            if application_id
            else "You do not have permission to perform this operation on this application"
        )
        super().__init__(msg)


class ApplicationStatusError(Exception):
    def __init__(self, current_status: str = "", attempted_action: str = "") -> None:
        if current_status and attempted_action:
            super().__init__(f"Cannot {attempted_action} application with status {current_status}")
        else:
            super().__init__("Invalid application status transition")
