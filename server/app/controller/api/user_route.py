import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.account_settings_dto import ChangePasswordInput, RequestAccountDeletionInput
from app.application.dto.profile_dto import GetLoginHistoryInput, UpdateProfileInput, UserOnboardingInput
from app.application.use_cases.account_settings_usecase import AccountSettingsUseCase
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.profile_usecase import CheckAliasUseCase, GetLoginHistoryUseCase, OnboardingUseCase, UpdateProfileUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_profile
from app.controller.dependencies import get_audit_log_use_case, get_current_user_id, get_onboarding_use_case, get_update_profile_use_case
from app.controller.dependencies.use_cases_depends import (
    get_change_password_use_case,
    get_check_alias_use_case,
    get_delete_account_use_case,
    get_login_history_use_case,
)
from app.controller.docs.user_docs import (
    ACCOUNT_DELETION_CONFLICT,
    ACCOUNT_DELETION_FORBIDDEN,
    ACCOUNT_DELETION_INVALID_PASSWORD,
    ACCOUNT_DELETION_VALIDATION_ERROR,
    ALIAS_CHECK_UNAUTHORIZED,
    CHANGE_PASSWORD_VALIDATION_ERROR,
    EMAIL_NOT_VERIFIED,
    INVALID_CURRENT_PASSWORD,
    ONBOARDING_CONFLICT,
    ONBOARDING_VALIDATION_ERROR,
    PROFILE_NOT_FOUND,
    SAME_PASSWORD_ERROR,
    UNAUTHORIZED,
    UPDATE_PROFILE_CONFLICT,
    UPDATE_PROFILE_FORBIDDEN,
    UPDATE_PROFILE_VALIDATION_ERROR,
    USER_NOT_FOUND,
)
from app.controller.schemas.user_schema import (
    _ALIAS_RE,
    ChangePasswordRequest,
    ChangePasswordResponse,
    CheckAliasResponse,
    DeleteAccountRequest,
    DeleteAccountResponse,
    LoginHistoryEntryResponse,
    LoginHistoryListResponse,
    UpdateProfileRequest,
    UpdateProfileResponse,
    UserOnboardingRequest,
    UserOnboardingResponse,
    UserPermissionsResponse,
)
from app.core.security.token_service import create_access_token
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.exceptions.auth_exceptions import InvalidCredentialsError
from app.domain.exceptions.user_exceptions import (
    AccountDeletionAlreadyScheduledError,
    AccountDeletionGracePeriodExpiredError,
    AliasAlreadyTakenError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
    ProfileNotFoundError,
    SamePasswordError,
    UserInactiveError,
    UserNotFoundError,
)
from app.infrastructure.database.repositories.rbac_repository import RBACRepository
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/user", tags=["Profile"])
account_settings_router = APIRouter(prefix="/user", tags=["Account Settings"])


@account_settings_router.patch(
    "/profile",
    response_model=UpdateProfileResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **UPDATE_PROFILE_FORBIDDEN,
        **PROFILE_NOT_FOUND,
        **UPDATE_PROFILE_CONFLICT,
        **UPDATE_PROFILE_VALIDATION_ERROR,
    },
    summary="Update account profile",
    description=(
        "Update the authenticated user's public profile — alias, display name, demographics, and bio. "
        "If the alias is changed, it is checked for uniqueness before the update is applied. "
        "A refreshed access token is returned on success to reflect the new profile state."
    ),
)
async def update_profile(
    request: Request,
    body: UpdateProfileRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: UpdateProfileUseCase = Depends(get_update_profile_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
    db: AsyncSession = Depends(get_db),
) -> UpdateProfileResponse:
    """Update the authenticated user's mutable profile fields.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — account is inactive or deleted.
    - **404 Not Found** — no user or profile found for the authenticated account
      (profile requires completed onboarding).
    - **409 Conflict** — the requested alias is already owned by another account.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.update_profile(
            UpdateProfileInput(
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
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UserInactiveError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ProfileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except AliasAlreadyTakenError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    p = result.profile
    role_name = await UserRepository(db).get_active_role_name_by_user_id(user_id)
    new_token = create_access_token(
        user_id=p.user_id,
        email=p.email or "",
        done_onboarding=True,
        role=role_name,
        user=p,
    )
    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="profile",
        resource_id=str(user_id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_profile(result.previous_profile),
        new_values=serialize_profile(p),
    )
    return UpdateProfileResponse(
        user_id=p.user_id,
        alias=p.alias,
        first_name=p.first_name,
        last_name=p.last_name,
        age_group=p.age_group,
        gender=p.gender,
        education_level=p.education_level,
        occupation=p.occupation,
        bio=p.bio,
        access_token=new_token,
    )


@account_settings_router.get(
    "/login-history",
    response_model=LoginHistoryListResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED},
    summary="Retrieve recent login history",
    description="Returns recent successful sign-ins for the authenticated user, newest first.",
)
async def get_login_history(
    limit: int = Query(default=10, ge=1, le=50),
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: GetLoginHistoryUseCase = Depends(get_login_history_use_case),
) -> LoginHistoryListResponse:
    result = await use_case.execute(GetLoginHistoryInput(user_id=user_id, limit=limit))
    return LoginHistoryListResponse(data=[LoginHistoryEntryResponse.model_validate(entry) for entry in result.entries])


@router.get(
    "/me/permissions",
    response_model=UserPermissionsResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED},
    summary="Get effective permissions for the current user",
    description=(
        "Returns a flat map of 'feature_slug:action' → allowed (bool) for the authenticated user. "
        "User-level grants take precedence over role permissions. "
        "Used by the client to gate UI elements without exposing the full permission model."
    ),
)
async def get_my_permissions(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserPermissionsResponse:
    role_name = await UserRepository(db).get_active_role_name_by_user_id(user_id)
    permissions = await RBACRepository(db).get_effective_permissions(user_id, role_name)
    return UserPermissionsResponse(permissions=permissions)


@router.get(
    "/check-alias",
    response_model=CheckAliasResponse,
    status_code=status.HTTP_200_OK,
    responses={**ALIAS_CHECK_UNAUTHORIZED},
    summary="Check alias availability",
    description="Returns whether the requested alias is available. Requires authentication.",
)
async def check_alias(
    alias: str = Query(min_length=3, max_length=100),
    _: uuid.UUID = Depends(get_current_user_id),
    use_case: CheckAliasUseCase = Depends(get_check_alias_use_case),
) -> CheckAliasResponse:
    normalized = alias.lower()
    if not _ALIAS_RE.match(normalized):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Alias may only contain lowercase letters, numbers, and underscores",
        )
    available = await use_case.is_available(normalized)
    return CheckAliasResponse(alias=normalized, available=available)


@router.post(
    "/onboard",
    response_model=UserOnboardingResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **UNAUTHORIZED,
        **USER_NOT_FOUND,
        **EMAIL_NOT_VERIFIED,
        **ONBOARDING_CONFLICT,
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
    db: AsyncSession = Depends(get_db),
) -> UserOnboardingResponse:
    """Complete the onboarding profile for the currently authenticated user.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — account is inactive/deleted, or email not yet verified.
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
    except UserInactiveError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except EmailNotVerifiedError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except OnboardingAlreadyCompletedError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except AliasAlreadyTakenError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    p = result.profile
    role_name = await UserRepository(db).get_active_role_name_by_user_id(p.user_id)
    new_token = create_access_token(
        user_id=p.user_id,
        email=p.email or "",
        done_onboarding=True,
        role=role_name,
        user=p,
    )
    return UserOnboardingResponse(
        user_id=p.user_id,
        alias=p.alias,
        first_name=p.first_name,
        last_name=p.last_name,
        age_group=p.age_group,
        gender=p.gender,
        education_level=p.education_level,
        occupation=p.occupation,
        bio=p.bio,
        access_token=new_token,
    )


@account_settings_router.post(
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
    use_case: AccountSettingsUseCase = Depends(get_change_password_use_case),
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


@account_settings_router.post(
    "/account-deletion",
    response_model=DeleteAccountResponse,
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        **UNAUTHORIZED,
        **ACCOUNT_DELETION_INVALID_PASSWORD,
        **ACCOUNT_DELETION_FORBIDDEN,
        **USER_NOT_FOUND,
        **ACCOUNT_DELETION_CONFLICT,
        **ACCOUNT_DELETION_VALIDATION_ERROR,
    },
    summary="Schedule deletion of the authenticated account",
    description=(
        "Schedule the authenticated user's account for deletion after a 30-day grace period. "
        "The caller must confirm the request with their current password. "
        "The request is persisted immediately, and a deferred ARQ job is enqueued to finalize the deletion once the grace period expires. "
        "If the user completes a fresh login during the grace period, the pending deletion is automatically canceled."
    ),
)
async def schedule_own_account_deletion(
    body: DeleteAccountRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: AccountSettingsUseCase = Depends(get_delete_account_use_case),
) -> DeleteAccountResponse:
    """Schedule deletion of the currently authenticated account.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token; or the
      supplied current password is incorrect.
    - **403 Forbidden** — account is inactive, already deleted, or the
      deletion grace period has already elapsed and finalization is pending.
    - **404 Not Found** — no user found for the ID encoded in the Bearer token.
    - **409 Conflict** — a deletion request is already pending for this account.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.request_self_service_deletion(
            RequestAccountDeletionInput(
                target_user_id=user_id,
                requested_by=user_id,
                current_password=body.current_password,
                reason=body.reason,
            )
        )
    except InvalidCredentialsError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))
    except UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except (UserInactiveError, AccountDeletionGracePeriodExpiredError) as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except AccountDeletionAlreadyScheduledError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    return DeleteAccountResponse(
        user_id=result.user_id,
        deletion_requested_at=result.deletion_requested_at,
        deletion_scheduled_for=result.deletion_scheduled_for,
        requested_by=result.requested_by,
    )
