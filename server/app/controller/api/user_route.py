import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.user_dto import ChangePasswordInput, UserOnboardingInput
from app.application.use_cases.user_usecase import ChangePasswordUseCase, OnboardingUseCase
from app.controller.dependencies import get_current_user_id, get_onboarding_use_case
from app.controller.dependencies.use_cases_depends import get_change_password_use_case
from app.controller.docs.user_docs import (
    ALIAS_CONFLICT,
    CHANGE_PASSWORD_VALIDATION_ERROR,
    EMAIL_NOT_VERIFIED,
    INVALID_CURRENT_PASSWORD,
    ONBOARDING_ALREADY_COMPLETED,
    ONBOARDING_VALIDATION_ERROR,
    SAME_PASSWORD_ERROR,
    UNAUTHORIZED,
    USER_NOT_FOUND,
)
from app.controller.schemas.user_schema import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    UserOnboardingRequest,
    UserOnboardingResponse,
)
from app.domain.exceptions.auth_exceptions import InvalidCredentialsError
from app.domain.exceptions.user_exceptions import (
    AliasAlreadyTakenError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
    SamePasswordError,
    UserInactiveError,
    UserNotFoundError,
)

router = APIRouter(prefix="/user", tags=["User"])


@router.post(
    "/onboard",
    response_model=UserOnboardingResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **USER_NOT_FOUND,
        **EMAIL_NOT_VERIFIED,
        **ONBOARDING_ALREADY_COMPLETED,
        **ALIAS_CONFLICT,
        **ONBOARDING_VALIDATION_ERROR,
    },
    summary="Complete user onboarding",
    description=(
        "Submit profile details to complete onboarding for the authenticated user. "
        "Requires a verified email address. "
        "Can only be completed once per account."
    ),
)
async def user_onboarding(
    body: UserOnboardingRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: OnboardingUseCase = Depends(get_onboarding_use_case),
) -> UserOnboardingResponse:
    """Complete the onboarding profile for the currently authenticated user.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — email address has not been verified yet.
    - **404 Not Found** — no user found for the ID encoded in the token.
    - **409 Conflict** — onboarding already completed, or the chosen alias
      is already taken by another user.
    - **422 Unprocessable Entity** — request body failed schema validation
      (e.g. alias contains spaces, required fields are missing, or an enum
      value is not recognised).
    """
    try:
        result = await use_case.complete_onboarding(
            UserOnboardingInput(
                user_id=user_id,
                alias=body.alias,
                first_name=body.first_name,
                last_name=body.last_name,
                age_group=body.age_group,
                gender=body.gender,
                education_level=body.education_level,
                occupation=body.occupation,
                bio=body.bio,
            )
        )
    except UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except EmailNotVerifiedError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except OnboardingAlreadyCompletedError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except AliasAlreadyTakenError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    return UserOnboardingResponse(
        user_id=result.profile.user_id,
        alias=result.profile.alias,
        first_name=result.profile.first_name,
        last_name=result.profile.last_name,
    )


@router.post(
    "/change-password",
    response_model=ChangePasswordResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **INVALID_CURRENT_PASSWORD,
        **SAME_PASSWORD_ERROR,
        **USER_NOT_FOUND,
        **EMAIL_NOT_VERIFIED,
        **CHANGE_PASSWORD_VALIDATION_ERROR,
    },
    summary="Change account password",
    description=(
        "Replace the authenticated user's current password with a new one. "
        "The caller must supply their existing password for verification before any change is applied. "
        "The new password must be at least 8 characters and must differ from the current password. "
        "On success, all active refresh tokens for the account are immediately revoked — "
        "every other session is invalidated as a security measure, requiring re-authentication. "
        "The current session's access token remains valid until its natural expiry, "
        "but its refresh token is also revoked so it cannot be silently rotated."
    ),
)
async def change_password(
    body: ChangePasswordRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: ChangePasswordUseCase = Depends(get_change_password_use_case),
) -> ChangePasswordResponse:
    """Verify the current password and replace it with the new one.

    # Error mapping
    - **400 Bad Request** — new password is identical to the current password.
    - **401 Unauthorized** — missing, expired, or invalid Bearer token; or the
      supplied current password is incorrect.
    - **403 Forbidden** — account is inactive, deleted, or email is unverified.
    - **404 Not Found** — no user found for the ID encoded in the Bearer token.
    - **422 Unprocessable Entity** — ``current_password`` is empty or
      ``new_password`` is shorter than 8 characters.
    """
    try:
        await use_case.change_password(
            ChangePasswordInput(
                user_id=user_id,
                current_password=body.current_password,
                new_password=body.new_password,
            )
        )
    except InvalidCredentialsError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except SamePasswordError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except (UserInactiveError, EmailNotVerifiedError) as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))

    return ChangePasswordResponse()
