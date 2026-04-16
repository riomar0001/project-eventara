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


class FeatureAlreadyExistsError(Exception):
    def __init__(self, slug: str) -> None:
        super().__init__(f"Feature slug already exists: {slug}")


class FeatureInUseError(Exception):
    def __init__(self, message: str = "Feature is still in use") -> None:
        super().__init__(message)


class UserGrantNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("User grant not found")


class DuplicateUserGrantError(Exception):
    def __init__(self, actions: list[str] | None = None) -> None:
        if actions:
            super().__init__(f"Grants already exist for actions: {', '.join(actions)}")
        else:
            super().__init__("One or more grants already exist for this user, feature, and action combination")


class RoleAlreadyExistsError(Exception):
    def __init__(self, name: str) -> None:
        super().__init__(f"Role name already exists: {name}")


class RoleInUseError(Exception):
    def __init__(self, message: str = "Role is still in use") -> None:
        super().__init__(message)


class ProtectedRoleDeletionError(Exception):
    def __init__(self, message: str = "System Administrator role cannot be deleted") -> None:
        super().__init__(message)
