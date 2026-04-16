class UserNotFoundError(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"User not found: {identifier}" if identifier else "User not found")


class EmailAlreadyTakenError(Exception):
    def __init__(self, email: str = "") -> None:
        super().__init__(f"Email '{email}' is already registered" if email else "Email is already registered")


class SameEmailError(Exception):
    def __init__(self) -> None:
        super().__init__("The new email address must be different from the current email")


class UserLockedError(Exception):
    def __init__(self) -> None:
        super().__init__("Account is temporarily locked due to too many failed login attempts")


class UserInactiveError(Exception):
    def __init__(self) -> None:
        super().__init__("Account is inactive or has been deleted")


class EmailAlreadyVerifiedError(Exception):
    def __init__(self) -> None:
        super().__init__("Email is already verified")


class EmailNotVerifiedError(Exception):
    def __init__(self) -> None:
        super().__init__("Email must be verified before completing onboarding")


class OnboardingAlreadyCompletedError(Exception):
    def __init__(self) -> None:
        super().__init__("Onboarding has already been completed")


class CompletedOnboardingRequiredError(Exception):
    def __init__(self) -> None:
        super().__init__("Onboarding must be completed to proceed")


class AliasAlreadyTakenError(Exception):
    def __init__(self, alias: str = "") -> None:
        super().__init__(f"Alias '{alias}' is already taken" if alias else "Alias is already taken")


class SamePasswordError(Exception):
    def __init__(self) -> None:
        super().__init__("New password must be different from the current password")


class AccountDeletionAlreadyScheduledError(Exception):
    def __init__(self) -> None:
        super().__init__("Account deletion is already scheduled")


class AccountDeletionGracePeriodExpiredError(Exception):
    def __init__(self) -> None:
        super().__init__("Account deletion grace period has expired and the account is awaiting final deletion")


class PasswordResetEmailNotVerifiedError(Exception):
    def __init__(self) -> None:
        super().__init__("The user's email address must be verified before sending a password reset link")
