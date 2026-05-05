"""Volunteer management API routes.

Exposes endpoints for adding new volunteers and creating dynamic volunteer roles.
Both endpoints require a valid access token and the appropriate RBAC permission.

Error mapping summary:
  - 401  missing, expired, or invalid Bearer token
  - 403  RBAC denial
  - 404  user or volunteer custom role not found
  - 409  user is already a volunteer / volunteer role name already exists
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dto.volunteer_dto import AddVolunteerInput, CreateVolunteerRoleInput
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.volunteer_usecase import VolunteerUseCase
from app.controller.api.audit_helpers import safe_audit_log
from app.controller.dependencies import get_audit_log_use_case, require_permission
from app.controller.dependencies.use_cases_depends import get_volunteer_use_case
from app.controller.docs.volunteer_docs import (
    FORBIDDEN,
    UNAUTHORIZED,
    USER_NOT_FOUND,
    VALIDATION_ERROR,
    VOLUNTEER_ALREADY_EXISTS,
    VOLUNTEER_ROLE_ALREADY_EXISTS,
    VOLUNTEER_ROLE_NOT_FOUND,
)
from app.controller.schemas.volunteer_schema import AddVolunteerRequest, CreateVolunteerRoleRequest
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.authorization_entities import RoleAction
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.domain.exceptions.volunteer_exceptions import VolunteerAlreadyExistsError
from app.domain.exceptions.volunteer_role_exceptions import (
    VolunteerRoleAlreadyExistsError,
    VolunteerRoleInactiveError,
    VolunteerRoleNotFoundError,
)

volunteer_router = APIRouter(prefix="/volunteers", tags=["Volunteers"])
volunteer_role_router = APIRouter(prefix="/volunteer-roles", tags=["Volunteers"])


def _serialize_volunteer(volunteer) -> dict:
    return {
        "id": str(volunteer.id),
        "user_id": str(volunteer.user_id),
        "contact_phone": volunteer.contact_phone,
        "volunteer_role_id": str(volunteer.volunteer_role_id),
        "status": volunteer.status.value if hasattr(volunteer.status, "value") else volunteer.status,
        "created_at": volunteer.created_at.isoformat() if volunteer.created_at else None,
        "updated_at": volunteer.updated_at.isoformat() if volunteer.updated_at else None,
    }


def _serialize_volunteer_role(role) -> dict:
    return {
        "id": str(role.id),
        "name": role.name,
        "description": role.description,
        "created_by": str(role.created_by) if role.created_by else None,
        "is_active": role.is_active,
        "created_at": role.created_at.isoformat() if role.created_at else None,
        "updated_at": role.updated_at.isoformat() if role.updated_at else None,
    }


@volunteer_router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **FORBIDDEN, **USER_NOT_FOUND, **VOLUNTEER_ROLE_NOT_FOUND, **VOLUNTEER_ALREADY_EXISTS, **VALIDATION_ERROR},
    summary="Add a new volunteer",
    description=(
        "Register a user as a volunteer by assigning them a dynamic volunteer role. "
        "The target user must exist and the volunteer custom role must be active. "
        "A user can only be registered as a volunteer once. "
        "The user's RBAC role is automatically updated to 'volunteer' if that system role exists."
    ),
)
async def add_volunteer(
    request: Request,
    body: AddVolunteerRequest,
    caller_id: uuid.UUID = Depends(require_permission("volunteers", RoleAction.CREATE)),
    use_case: VolunteerUseCase = Depends(get_volunteer_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Register a user as a volunteer and assign the RBAC 'volunteer' role.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``volunteers``.
    - **404 Not Found** — target user or volunteer custom role does not exist.
    - **409 Conflict** — the user is already registered as a volunteer.
    - **422 Unprocessable Entity** — the referenced volunteer role is inactive, or request body failed validation.
    """
    try:
        result = await use_case.add_volunteer(
            AddVolunteerInput(
                actor_id=caller_id,
                target_user_id=body.target_user_id,
                contact_phone=body.contact_phone,
                volunteer_role_id=body.volunteer_role_id,
            )
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (VolunteerRoleNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VolunteerRoleInactiveError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except VolunteerAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.CREATE,
        resource_type="volunteers",
        resource_id=str(result.volunteer.id),
        status=AuditLogStatus.SUCCESS,
        new_values=_serialize_volunteer(result.volunteer),
        additional_context={"target_user_id": str(body.target_user_id)},
    )

    return {
        "success": True,
        "message": "Volunteer added successfully.",
        "data": _serialize_volunteer(result.volunteer),
    }


@volunteer_role_router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VOLUNTEER_ROLE_ALREADY_EXISTS, **VALIDATION_ERROR},
    summary="Create a volunteer role",
    description=(
        "Create a new dynamic volunteer role definition. "
        "Role names are globally unique (case-insensitive). "
        "Community leaders use these roles to classify volunteers within their events."
    ),
)
async def create_volunteer_role(
    request: Request,
    body: CreateVolunteerRoleRequest,
    caller_id: uuid.UUID = Depends(require_permission("volunteer_roles", RoleAction.CREATE)),
    use_case: VolunteerUseCase = Depends(get_volunteer_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Create a new dynamic volunteer role.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``volunteer_roles``.
    - **409 Conflict** — a volunteer role with the same name already exists.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.create_volunteer_role(
            CreateVolunteerRoleInput(
                name=body.name,
                description=body.description,
                created_by=caller_id,
            )
        )
    except VolunteerRoleAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.CREATE,
        resource_type="volunteer_custom_roles",
        resource_id=str(result.role.id),
        status=AuditLogStatus.SUCCESS,
        new_values=_serialize_volunteer_role(result.role),
    )

    return {
        "success": True,
        "message": "Volunteer role created successfully.",
        "data": _serialize_volunteer_role(result.role),
    }
