class InvalidTokenError(Exception):
    def __init__(self, reason: str = "") -> None:
        super().__init__(reason if reason else "Invalid or malformed token")


class TokenExpiredError(Exception):
    def __init__(self) -> None:
        super().__init__("Token has expired")


class InvalidCredentialsError(Exception):
    def __init__(self) -> None:
        super().__init__("Invalid email or password")


class InvalidOTPError(Exception):
    def __init__(self) -> None:
        super().__init__("Invalid or expired verification code")
