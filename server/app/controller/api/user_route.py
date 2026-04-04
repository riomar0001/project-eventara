import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.user_dto import UserOnboardingInput
from app.application.use_cases.user_usecase import OnboardingUseCase
from app.controller.dependencies import get_current_user_id, get_onboarding_use_case
from app.controller.schemas.user_schema import (
    UserOnboardingRequest,
    UserOnboardingResponse,
)
from app.controller.docs.user_docs import (
    ALIAS_CONFLICT,
    EMAIL_NOT_VERIFIED,
    ONBOARDING_ALREADY_COMPLETED,
    ONBOARDING_VALIDATION_ERROR,
    UNAUTHORIZED,
    USER_NOT_FOUND,
)


from app.domain.exceptions.user_exceptions import (
    AliasAlreadyTakenError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
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
