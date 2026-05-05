class VolunteerRoleNotFoundError(Exception):
    def __init__(self, role_id: str = "") -> None:
        super().__init__(f"Volunteer role not found: {role_id}" if role_id else "Volunteer role not found")


class VolunteerRoleAlreadyExistsError(Exception):
    def __init__(self, name: str = "") -> None:
        super().__init__(f"Volunteer role already exists: {name}" if name else "Volunteer role already exists")


class VolunteerRoleInactiveError(Exception):
    def __init__(self, role_id: str = "") -> None:
        super().__init__(f"Volunteer role is inactive: {role_id}" if role_id else "Volunteer role is inactive")


class UnauthorizedVolunteerRoleOperationError(Exception):
    def __init__(self, role_id: str = "") -> None:
        msg = (
            f"You do not have permission to perform this operation on volunteer role: {role_id}"
            if role_id
            else "You do not have permission to perform this operation on this volunteer role"
        )
        super().__init__(msg)
