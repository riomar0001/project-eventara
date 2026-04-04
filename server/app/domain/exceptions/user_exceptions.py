class UserNotFoundError(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"User not found: {identifier}" if identifier else "User not found")


class EmailAlreadyTakenError(Exception):
    def __init__(self, email: str = "") -> None:
        super().__init__(f"Email '{email}' is already registered" if email else "Email is already registered")


class UserLockedError(Exception):
    def __init__(self) -> None:
        super().__init__("Account is temporarily locked due to too many failed login attempts")


class UserInactiveError(Exception):
    def __init__(self) -> None:
        super().__init__("Account is inactive or has been deleted")


class EmailAlreadyVerifiedError(Exception):
    def __init__(self) -> None:
        super().__init__("Email is already verified")
