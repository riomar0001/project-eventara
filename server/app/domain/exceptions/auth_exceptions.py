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
    """Raised when the submitted OTP is incorrect, expired, or already consumed.

    Combining all OTP failure modes into one exception prevents an attacker
    from distinguishing between a wrong code, a consumed code, and an expired
    code — consistent with the credential enumeration-prevention pattern used
    throughout the auth layer.
    """

    def __init__(self) -> None:
        super().__init__("Invalid or expired verification code")
