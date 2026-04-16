class RoleNotFoundError(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"Role not found: {identifier}" if identifier else "Role not found")


class RoleAssignmentNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("Role assignment not found")


class RoleAlreadyAssignedError(Exception):
    def __init__(self) -> None:
        super().__init__("This role is already assigned to the user")


class RoleAlreadyCurrentError(Exception):
    def __init__(self) -> None:
        super().__init__("This role is already the user's current effective role")


class FeatureNotFoundError(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"Feature not found: {identifier}" if identifier else "Feature not found")


class UserGrantNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("User grant not found")


class DuplicateUserGrantError(Exception):
    def __init__(self, actions: list[str] | None = None) -> None:
        if actions:
            super().__init__(f"Grants already exist for actions: {', '.join(actions)}")
        else:
            super().__init__("One or more grants already exist for this user, feature, and action combination")
