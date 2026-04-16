"""Administrative user-account API routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.dto.admin_user_account_dto import (
    ChangeUserEmailInput,
    ChangeUserRoleInput,
    ListUserAccountsInput,
    SendUserPasswordResetInput,
)
from app.application.use_cases.admin_user_account_usecase import AdminUserAccountUseCase
from app.controller.dependencies import require_permission
from app.controller.dependencies.use_cases_depends import get_admin_user_account_use_case
from app.controller.docs.user_account_docs import (
    EMAIL_CHANGE_VALIDATION_ERROR,
    EMAIL_CONFLICT,
    FORBIDDEN,
    LIST_VALIDATION_ERROR,
    PASSWORD_RESET_CONFLICT,
    ROLE_ALREADY_CURRENT,
    ROLE_CHANGE_VALIDATION_ERROR,
    ROLE_NOT_FOUND,
    UNAUTHORIZED,
    USER_NOT_FOUND,
)
from app.controller.schemas.user_account_schema import (
    AdminUserAccountDetailResponse,
    AdminUserAccountListResponse,
    AdminUserAccountPaginationResponse,
    AdminUserAccountSummaryResponse,
    AssignableRoleListResponse,
    AssignableRoleResponse,
    ChangeUserEmailRequest,
    ChangeUserEmailResponse,
    ChangeUserRoleRequest,
    ChangeUserRoleResponse,
    RolePermissionResponse,
    SendUserPasswordResetResponse,
)
from app.domain.entities.authorization_entities import RoleAction
from app.domain.entities.user_entity import UserStatus
from app.domain.exceptions.role_exceptions import RoleAlreadyCurrentError, RoleNotFoundError
from app.domain.exceptions.user_exceptions import (
    EmailAlreadyTakenError,
    PasswordResetEmailNotVerifiedError,
    SameEmailError,
    UserInactiveError,
    UserNotFoundError,
)

router = APIRouter(prefix="/user-accounts", tags=["Admin User Accounts"])


@router.get(
    "/roles",
    response_model=AssignableRoleListResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN},
    summary="List assignable system roles",
    description="Return the role catalog used by the admin change-role dialog.",
)
async def list_roles(
    _: uuid.UUID = Depends(require_permission("user-accounts", RoleAction.READ)),
    use_case: AdminUserAccountUseCase = Depends(get_admin_user_account_use_case),
) -> AssignableRoleListResponse:
    """Return the roles administrators can assign from the management UI.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``user-accounts``.
    """
    result = await use_case.list_roles()
    return AssignableRoleListResponse(
        data=[
            AssignableRoleResponse(
                id=role.id,
                name=role.name,
                description=role.description,
                is_default=role.is_default,
                is_system=role.is_system,
                permissions=[
                    RolePermissionResponse(
                        feature_slug=permission.feature_slug,
                        feature_name=permission.feature_name,
                        action=permission.action,
                        effect=permission.effect,
                    )
                    for permission in role.permissions
                ],
            )
            for role in result.roles
        ]
    )


@router.get(
    "",
    response_model=AdminUserAccountListResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **LIST_VALIDATION_ERROR},
    summary="List user accounts",
    description=(
        "Return a paginated administrative list of user accounts for the management table. "
        "Optionally filter by ``status`` and/or search across name, email, and alias with ``search``."
    ),
)
async def list_user_accounts(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200, description="Case-insensitive text search across name, email, and alias."),
    user_status: UserStatus | None = Query(default=None, alias="status", description="Filter by exact account status."),
    role_name: str | None = Query(default=None, alias="role", description="Filter by exact assigned role name."),
    _: uuid.UUID = Depends(require_permission("user-accounts", RoleAction.READ)),
    use_case: AdminUserAccountUseCase = Depends(get_admin_user_account_use_case),
) -> AdminUserAccountListResponse:
    """Return one page of user-account summaries for administrators.

    Supports optional server-side search (``search``), status filtering
    (``status``), and role filtering (``role``). All parameters are independent and may be combined.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``user-accounts``.
    - **422 Unprocessable Entity** — pagination or filter query parameters are invalid.
    """
    result = await use_case.list_user_accounts(
        ListUserAccountsInput(
            page=page,
            page_size=page_size,
            search=search,
            status=user_status,
            role_name=role_name,
        )
    )
    return AdminUserAccountListResponse(
        data=[
            AdminUserAccountSummaryResponse(
                user_id=user.user_id,
                name=user.name,
                alias=user.alias,
                email=user.email,
                role_id=user.role_id,
                role_name=user.role_name,
                status=user.status,
                deletion_scheduled_for=user.deletion_scheduled_for,
            )
            for user in result.users
        ],
        pagination=AdminUserAccountPaginationResponse(
            page=result.page,
            page_size=result.page_size,
            total_count=result.total_count,
            total_pages=result.total_pages,
            has_next=result.page < result.total_pages,
            has_previous=result.page > 1 and result.total_pages > 0,
        ),
    )


@router.get(
    "/{user_id}",
    response_model=AdminUserAccountDetailResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **USER_NOT_FOUND, **LIST_VALIDATION_ERROR},
    summary="Get user account details",
    description="Return the full administrative profile details for a specific user account.",
)
async def get_user_account_detail(
    user_id: uuid.UUID,
    _: uuid.UUID = Depends(require_permission("user-accounts", RoleAction.READ)),
    use_case: AdminUserAccountUseCase = Depends(get_admin_user_account_use_case),
) -> AdminUserAccountDetailResponse:
    """Return a detailed administrative view of one user account.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``user-accounts``.
    - **404 Not Found** — the target account does not exist.
    - **422 Unprocessable Entity** — ``user_id`` is not a valid UUID.
    """
    try:
        detail = await use_case.get_user_account_detail(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return AdminUserAccountDetailResponse(
        user_id=detail.user_id,
        name=detail.name,
        email=detail.email,
        status=detail.status,
        role_id=detail.role_id,
        role_name=detail.role_name,
        alias=detail.alias,
        first_name=detail.first_name,
        last_name=detail.last_name,
        age_group=detail.age_group,
        gender=detail.gender,
        education_level=detail.education_level,
        occupation=detail.occupation,
        bio=detail.bio,
        onboarding_completed=detail.onboarding_completed,
        onboarding_completed_at=detail.onboarding_completed_at,
        email_verified=detail.email_verified,
        email_verified_at=detail.email_verified_at,
        password_change_at=detail.password_change_at,
        failed_login_attempts=detail.failed_login_attempts,
        locked_until=detail.locked_until,
        last_login_at=detail.last_login_at,
        last_activity_at=detail.last_activity_at,
        login_count=detail.login_count,
        deletion_requested_at=detail.deletion_requested_at,
        deletion_scheduled_for=detail.deletion_scheduled_for,
        deletion_requested_by=detail.deletion_requested_by,
        deletion_reason=detail.deletion_reason,
        deleted_at=detail.deleted_at,
        created_at=detail.created_at,
        updated_at=detail.updated_at,
        role_permissions=[
            RolePermissionResponse(
                feature_slug=permission.feature_slug,
                feature_name=permission.feature_name,
                action=permission.action,
                effect=permission.effect,
            )
            for permission in detail.role_permissions
        ],
    )


@router.patch(
    "/{user_id}/role",
    response_model=ChangeUserRoleResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **USER_NOT_FOUND, **ROLE_NOT_FOUND, **ROLE_ALREADY_CURRENT, **ROLE_CHANGE_VALIDATION_ERROR},
    summary="Change a user's effective role",
    description="Replace the target user's current effective role with a single new role.",
)
async def change_user_role(
    user_id: uuid.UUID,
    body: ChangeUserRoleRequest,
    caller_id: uuid.UUID = Depends(require_permission("user-accounts", RoleAction.UPDATE)),
    use_case: AdminUserAccountUseCase = Depends(get_admin_user_account_use_case),
) -> ChangeUserRoleResponse:
    """Replace a user's current role assignment set with one effective role.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission or the target account is inactive.
    - **404 Not Found** — the target user or requested role does not exist.
    - **409 Conflict** — the requested role is already the user's only current effective role.
    - **422 Unprocessable Entity** — the path or request body is invalid.
    """
    try:
        result = await use_case.change_role(
            ChangeUserRoleInput(
                user_id=user_id,
                role_id=body.role_id,
                changed_by=caller_id,
            )
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UserInactiveError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except RoleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RoleAlreadyCurrentError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return ChangeUserRoleResponse(
        user_id=result.user_id,
        role_id=result.role_id,
        role_name=result.role_name,
        permissions=[
            RolePermissionResponse(
                feature_slug=permission.feature_slug,
                feature_name=permission.feature_name,
                action=permission.action,
                effect=permission.effect,
            )
            for permission in result.permissions
        ],
    )


@router.patch(
    "/{user_id}/email",
    response_model=ChangeUserEmailResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **USER_NOT_FOUND, **EMAIL_CONFLICT, **EMAIL_CHANGE_VALIDATION_ERROR},
    summary="Change a user's email address",
    description="Update the target user's email, clear verification status, and send a fresh verification link.",
)
async def change_user_email(
    user_id: uuid.UUID,
    body: ChangeUserEmailRequest,
    caller_id: uuid.UUID = Depends(require_permission("user-accounts", RoleAction.UPDATE)),
    use_case: AdminUserAccountUseCase = Depends(get_admin_user_account_use_case),
) -> ChangeUserEmailResponse:
    """Update a user's email address and force re-verification.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission or the target account is inactive.
    - **404 Not Found** — the target user does not exist.
    - **409 Conflict** — the email matches the current value or is already taken by another account.
    - **422 Unprocessable Entity** — the path or request body is invalid.
    """
    try:
        result = await use_case.change_email(
            ChangeUserEmailInput(
                user_id=user_id,
                email=body.email,
                changed_by=caller_id,
            )
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UserInactiveError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (SameEmailError, EmailAlreadyTakenError) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return ChangeUserEmailResponse(user_id=result.user_id, email=result.email)


@router.post(
    "/{user_id}/password-reset",
    response_model=SendUserPasswordResetResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **USER_NOT_FOUND, **PASSWORD_RESET_CONFLICT},
    summary="Send a password reset link for a user",
    description="Dispatch the existing password-reset email flow to the target user's current verified email address.",
)
async def send_user_password_reset(
    user_id: uuid.UUID,
    caller_id: uuid.UUID = Depends(require_permission("user-accounts", RoleAction.UPDATE)),
    use_case: AdminUserAccountUseCase = Depends(get_admin_user_account_use_case),
) -> SendUserPasswordResetResponse:
    """Send the target user a password reset link through the admin workflow.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission or the target account is inactive.
    - **404 Not Found** — the target user does not exist.
    - **409 Conflict** — the target email address is not verified and cannot receive a reset link.
    """
    try:
        await use_case.send_password_reset(
            SendUserPasswordResetInput(
                user_id=user_id,
                requested_by=caller_id,
            )
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UserInactiveError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except PasswordResetEmailNotVerifiedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return SendUserPasswordResetResponse()
