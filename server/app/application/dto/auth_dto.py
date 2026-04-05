from dataclasses import dataclass

from app.domain.entities.user_entity import PublicUser


@dataclass
class RegisterUserInput:
    email: str
    password: str


@dataclass
class LoginUserInput:
    email: str
    password: str


@dataclass
class RegisteredUserOutput:
    user: PublicUser
    verification_token: str


@dataclass
class VerifiedEmailOutput:
    access_token: str
    refresh_token: str


@dataclass
class LoginOutput:
    """Output produced by a successful login.

    Attributes:
        access_token: Short-lived JWT used to authenticate API requests.
        refresh_token: Long-lived opaque token stored in DB; used to
            obtain new access tokens without re-entering credentials.
    """

    access_token: str
    refresh_token: str


@dataclass
class LoginInitInput:
    """Input for the first step of OTP-based login.

    Attributes:
        email:    The user's registered email address.
        password: The user's plaintext password.
    """

    email: str
    password: str


@dataclass
class LoginInitOutput:
    """Output for the first step of OTP-based login.

    Attributes:
        verification_token: A short-lived signed JWT that encodes the
            user's identity.  It must be submitted along with the OTP
            code to the ``/login/verify`` endpoint.
    """

    verification_token: str


@dataclass
class LoginVerifyInput:
    """Input for the second step of OTP-based login.

    Attributes:
        token: The ``verification_token`` returned by ``/login/init``.
        code:  The 6-digit OTP delivered to the user's email address.
    """

    token: str
    code: str


@dataclass
class LoginVerifyOutput:
    """Output produced by a successful OTP verification.

    Attributes:
        access_token:  Short-lived JWT for authenticating API requests.
        refresh_token: Long-lived token for obtaining new access tokens.
    """

    access_token: str
    refresh_token: str
