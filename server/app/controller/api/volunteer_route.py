"""Volunteer management API routes.

Exposes endpoints for adding new volunteers, creating/reading/updating/deleting
dynamic volunteer roles, and managing the volunteer application lifecycle
(submit, review, withdraw).

Error mapping summary:
  - 401  missing, expired, or invalid Bearer token
  - 403  RBAC denial or not the application owner
  - 404  user, volunteer custom role, or application not found
  - 409  user is already a volunteer / volunteer role name already exists / active
         application already exists
  - 422  invalid status transition / inactive role / request body failed validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.application.dto.volunteer_dto import (
    _UNSET,
    AddVolunteerInput,
    CreateVolunteerRoleInput,
    DeleteVolunteerRoleInput,
    GetAllVolunteerRolesInput,
    GetAllVolunteersInput,
    GetPotentialVolunteersInput,
    ReviewApplicationInput,
    SubmitApplicationInput,
    UpdateVolunteerInfoInput,
    UpdateVolunteerRoleInput,
    WithdrawApplicationInput,
)
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.volunteer_usecase import (
    GetVolunteerUseCase,
    UpdateVolunteerInfoUseCase,
    VolunteerApplicationUseCase,
    VolunteerRoleUseCase,
    VolunteerUseCase,
)
from app.controller.api.audit_helpers import safe_audit_log
from app.controller.dependencies import (
    get_audit_log_use_case,
    require_completed_onboarding,
    require_permission,
)
from app.controller.dependencies.use_cases_depends import (
    get_all_volunteers_use_case,
    get_update_volunteer_use_case,
    get_volunteer_application_use_case,
    get_volunteer_role_use_case,
    get_volunteer_use_case,
)
from app.controller.docs.volunteer_docs import (
    APPLICATION_ALREADY_EXISTS,
    APPLICATION_NOT_FOUND,
    FORBIDDEN,
    INVALID_APPLICATION_TRANSITION,
    UNAUTHORIZED,
    UNAUTHORIZED_APPLICATION_OPERATION,
    USER_NOT_FOUND,
    VALIDATION_ERROR,
    VOLUNTEER_ALREADY_EXISTS,
    VOLUNTEER_NOT_FOUND,
    VOLUNTEER_ROLE_ALREADY_EXISTS,
    VOLUNTEER_ROLE_NOT_FOUND,
)
from app.controller.schemas.volunteer_schema import (
    AddVolunteerRequest,
    CreateVolunteerRoleRequest,
    ReviewApplicationRequest,
    SubmitApplicationRequest,
    UpdateVolunteerRequest,
    UpdateVolunteerRoleRequest,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.authorization_entities import RoleAction
from app.domain.entities.volunteer_entity import ApplicationStatus, VolunteerStatus
from app.domain.exceptions.user_exceptions import UserNotFoundError
from app.domain.exceptions.volunteer_application_exceptions import (
    InvalidApplicationStatusTransitionError,
    UnauthorizedApplicationOperationError,
    VolunteerApplicationAlreadyExistsError,
    VolunteerApplicationNotFoundError,
)
from app.domain.exceptions.volunteer_exceptions import VolunteerAlreadyExistsError, VolunteerNotFoundError
from app.domain.exceptions.volunteer_role_exceptions import (
    VolunteerRoleAlreadyExistsError,
    VolunteerRoleInactiveError,
    VolunteerRoleNotFoundError,
)

volunteer_router = APIRouter(prefix="/volunteers", tags=["Volunteers"])
volunteer_role_router = APIRouter(prefix="/volunteer-roles", tags=["Volunteers"])
volunteer_application_router = APIRouter(prefix="/volunteer-applications", tags=["Volunteers"])


def _serialize_application(application) -> dict:
    return {
        "id": str(application.id),
        "user_id": str(application.user_id),
        "status": application.status.value if hasattr(application.status, "value") else application.status,
        "application_data": application.application_data,
        "created_at": application.created_at.isoformat() if application.created_at else None,
        "updated_at": application.updated_at.isoformat() if application.updated_at else None,
    }


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


def _serialize_volunteer_summary(volunteer) -> dict:
    return {
        "id": str(volunteer.id),
        "user_id": str(volunteer.user_id),
        "contact_phone": volunteer.contact_phone,
        "volunteer_role_id": str(volunteer.volunteer_role_id),
        "status": volunteer.status.value if hasattr(volunteer.status, "value") else volunteer.status,
        "first_name": volunteer.first_name,
        "last_name": volunteer.last_name,
        "alias": volunteer.alias,
        "email": volunteer.email,
        "role_name": volunteer.role_name,
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
    except VolunteerRoleNotFoundError as exc:
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


@volunteer_router.get(
    "",
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VALIDATION_ERROR},
    summary="List volunteers",
    description=(
        "Return a paginated list of registered volunteers. "
        "Optionally filter by status (active, inactive, suspended) and volunteer role ID. "
        "Results are ordered by registration date descending."
    ),
)
async def get_all_volunteers(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    volunteer_status: VolunteerStatus | None = Query(default=None, alias="status"),
    role_id: uuid.UUID | None = Query(default=None),
    caller_id: uuid.UUID = Depends(require_permission("volunteers", RoleAction.READ)),
    use_case: GetVolunteerUseCase = Depends(get_all_volunteers_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Return a paginated list of registered volunteers.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``volunteers``.
    - **422 Unprocessable Entity** — query parameter validation failed.
    """
    result = await use_case.get_all_volunteers(
        GetAllVolunteersInput(
            page=page,
            page_size=page_size,
            status=volunteer_status,
            role_id=role_id,
        )
    )

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.READ,
        resource_type="volunteers",
        resource_id=None,
        status=AuditLogStatus.SUCCESS,
        additional_context={
            "page": page,
            "page_size": page_size,
            "status_filter": volunteer_status.value if volunteer_status else None,
            "role_id_filter": str(role_id) if role_id else None,
            "total": result.total,
        },
    )

    return {
        "success": True,
        "message": "Volunteers retrieved successfully.",
        "data": {
            "volunteers": [_serialize_volunteer_summary(v) for v in result.volunteers],
            "total": result.total,
            "page": result.page,
            "page_size": result.page_size,
            "total_pages": result.total_pages,
        },
    }


@volunteer_router.get(
    "/potential",
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VALIDATION_ERROR},
    summary="List potential volunteers",
    description=(
        "Return a paginated list of users ranked by event-participation count who are not yet registered volunteers. "
        "Results are ordered by descending event count so the most engaged participants appear first. "
        "Optionally filter by a minimum event threshold and search by name, alias, or email."
    ),
)
async def get_potential_volunteers(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    min_events: int = Query(default=1, ge=1),
    search: str | None = Query(default=None, max_length=100),
    caller_id: uuid.UUID = Depends(require_permission("volunteers", RoleAction.READ)),
    use_case: GetVolunteerUseCase = Depends(get_all_volunteers_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Return a paginated list of potential volunteer candidates ranked by event participation.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``volunteers``.
    - **422 Unprocessable Entity** — query parameter validation failed.
    """
    result = await use_case.get_potential_volunteers(
        GetPotentialVolunteersInput(
            page=page,
            page_size=page_size,
            min_events=min_events,
            search=search,
        )
    )

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.READ,
        resource_type="volunteers",
        resource_id=None,
        status=AuditLogStatus.SUCCESS,
        additional_context={
            "view": "potential_volunteers",
            "page": page,
            "page_size": page_size,
            "min_events": min_events,
            "search": search,
            "total": result.total,
        },
    )

    return {
        "success": True,
        "message": "Potential volunteers retrieved successfully.",
        "data": {
            "potential_volunteers": [
                {
                    "user_id": str(pv.user_id),
                    "first_name": pv.first_name,
                    "last_name": pv.last_name,
                    "alias": pv.alias,
                    "email": pv.email,
                    "events_count": pv.events_count,
                }
                for pv in result.potential_volunteers
            ],
            "total": result.total,
            "page": result.page,
            "page_size": result.page_size,
            "total_pages": result.total_pages,
        },
    }


@volunteer_router.patch(
    "/{volunteer_id}",
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VOLUNTEER_NOT_FOUND, **VOLUNTEER_ROLE_NOT_FOUND, **VALIDATION_ERROR},
    summary="Update volunteer info",
    description=(
        "Partially update a volunteer's contact phone, role assignment, and/or status. "
        "All fields are optional; omitted fields are left unchanged. "
        "The referenced volunteer role must exist and be active when changing the role assignment."
    ),
)
async def update_volunteer_info(
    request: Request,
    volunteer_id: uuid.UUID,
    body: UpdateVolunteerRequest,
    caller_id: uuid.UUID = Depends(require_permission("volunteers", RoleAction.UPDATE)),
    use_case: UpdateVolunteerInfoUseCase = Depends(get_update_volunteer_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Partially update an existing volunteer record.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission on ``volunteers``.
    - **404 Not Found** — no volunteer or volunteer role exists for the given IDs.
    - **422 Unprocessable Entity** — the referenced volunteer role is inactive, or request body failed validation.
    """
    try:
        result = await use_case.update_volunteer_info(
            UpdateVolunteerInfoInput(
                volunteer_id=volunteer_id,
                actor_id=caller_id,
                contact_phone=body.contact_phone,
                volunteer_role_id=body.volunteer_role_id,
                status=body.status,
            )
        )
    except VolunteerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VolunteerRoleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VolunteerRoleInactiveError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.UPDATE,
        resource_type="volunteers",
        resource_id=str(volunteer_id),
        status=AuditLogStatus.SUCCESS,
        old_values=result.old_values,
        new_values=_serialize_volunteer(result.volunteer),
    )

    return {
        "success": True,
        "message": "Volunteer updated successfully.",
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
    caller_id: uuid.UUID = Depends(require_permission("volunteer-roles", RoleAction.CREATE)),
    use_case: VolunteerUseCase = Depends(get_volunteer_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Create a new dynamic volunteer role.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``volunteer-roles``.
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


@volunteer_application_router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    responses={
        **UNAUTHORIZED,
        **VOLUNTEER_ALREADY_EXISTS,
        **APPLICATION_ALREADY_EXISTS,
        **VALIDATION_ERROR,
    },
    summary="Submit a volunteer application",
    description=(
        "Submit a volunteer application for the authenticated user. "
        "A user who is already an active volunteer or already has a pending or approved "
        "application cannot submit a new one. "
        "Optional application_data may include free-form fields such as skills and availability."
    ),
)
async def submit_application(
    request: Request,
    body: SubmitApplicationRequest,
    caller_id: uuid.UUID = Depends(require_completed_onboarding),
    use_case: VolunteerApplicationUseCase = Depends(get_volunteer_application_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Submit a volunteer application for the currently authenticated user.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **409 Conflict** — the user is already an active volunteer, or already has a
      PENDING or APPROVED application.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.submit_application(
            SubmitApplicationInput(
                user_id=caller_id,
                application_data=body.application_data,
            )
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VolunteerAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except VolunteerApplicationAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.CREATE,
        resource_type="volunteer_applications",
        resource_id=str(result.application.id),
        status=AuditLogStatus.SUCCESS,
        new_values=_serialize_application(result.application),
    )

    return {
        "success": True,
        "message": "Volunteer application submitted successfully.",
        "data": _serialize_application(result.application),
    }


@volunteer_application_router.patch(
    "/{application_id}/review",
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **APPLICATION_NOT_FOUND,
        **VOLUNTEER_ROLE_NOT_FOUND,
        **VOLUNTEER_ALREADY_EXISTS,
        **APPLICATION_ALREADY_EXISTS,
        **INVALID_APPLICATION_TRANSITION,
        **VALIDATION_ERROR,
    },
    summary="Review a volunteer application",
    description=(
        "Approve or reject a pending volunteer application. "
        "When approving, provide contact_phone and volunteer_role_id to automatically "
        "create a Volunteer record within the same transaction. "
        "Only PENDING applications can be reviewed."
    ),
)
async def review_application(
    request: Request,
    application_id: uuid.UUID,
    body: ReviewApplicationRequest,
    caller_id: uuid.UUID = Depends(require_permission("volunteer_applications", RoleAction.UPDATE)),
    use_case: VolunteerApplicationUseCase = Depends(get_volunteer_application_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Approve or reject a pending volunteer application.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission on ``volunteer_applications``.
    - **404 Not Found** — application or volunteer custom role not found.
    - **409 Conflict** — the applicant is already an active volunteer (on approval).
    - **422 Unprocessable Entity** — invalid status transition, inactive volunteer role,
      or request body failed validation.
    """
    try:
        result = await use_case.review_application(
            ReviewApplicationInput(
                application_id=application_id,
                reviewer_id=caller_id,
                new_status=body.status,
                contact_phone=body.contact_phone,
                volunteer_role_id=body.volunteer_role_id,
            )
        )
    except VolunteerApplicationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InvalidApplicationStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except VolunteerRoleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VolunteerRoleInactiveError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except VolunteerAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    action_verb = "approved" if body.status == ApplicationStatus.APPROVED else "rejected"
    new_values: dict = {"application": _serialize_application(result.application)}
    if result.volunteer:
        new_values["volunteer"] = _serialize_volunteer(result.volunteer)

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.UPDATE,
        resource_type="volunteer_applications",
        resource_id=str(application_id),
        status=AuditLogStatus.SUCCESS,
        new_values=new_values,
        additional_context={"action": action_verb},
    )

    return {
        "success": True,
        "message": f"Volunteer application {action_verb} successfully.",
        "data": {
            "application": _serialize_application(result.application),
            "volunteer": _serialize_volunteer(result.volunteer) if result.volunteer else None,
        },
    }


@volunteer_application_router.delete(
    "/{application_id}",
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **UNAUTHORIZED_APPLICATION_OPERATION,
        **APPLICATION_NOT_FOUND,
        **INVALID_APPLICATION_TRANSITION,
        **VALIDATION_ERROR,
    },
    summary="Withdraw a volunteer application",
    description=(
        "Withdraw the caller's own pending volunteer application. "
        "Only the applicant may withdraw their application, and only while it is in PENDING status."
    ),
)
async def withdraw_application(
    request: Request,
    application_id: uuid.UUID,
    caller_id: uuid.UUID = Depends(require_completed_onboarding),
    use_case: VolunteerApplicationUseCase = Depends(get_volunteer_application_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Withdraw the caller's own pending volunteer application.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — the caller is not the owner of the application.
    - **404 Not Found** — application does not exist.
    - **422 Unprocessable Entity** — application is not in PENDING status.
    """
    try:
        result = await use_case.withdraw_application(
            WithdrawApplicationInput(
                application_id=application_id,
                user_id=caller_id,
            )
        )
    except VolunteerApplicationNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UnauthorizedApplicationOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except InvalidApplicationStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.UPDATE,
        resource_type="volunteer_applications",
        resource_id=str(application_id),
        status=AuditLogStatus.SUCCESS,
        new_values=_serialize_application(result.application),
        additional_context={"action": "withdrawn"},
    )

    return {
        "success": True,
        "message": "Volunteer application withdrawn successfully.",
        "data": _serialize_application(result.application),
    }


@volunteer_role_router.get(
    "",
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VALIDATION_ERROR},
    summary="List volunteer roles",
    description=(
        "Return a paginated list of volunteer custom role definitions. "
        "Optionally filter by name substring (case-insensitive) and active status. "
        "Results are ordered by creation date descending."
    ),
)
async def get_all_volunteer_roles(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=100),
    is_active: bool | None = Query(default=None),
    caller_id: uuid.UUID = Depends(require_permission("volunteer-roles", RoleAction.READ)),
    use_case: VolunteerRoleUseCase = Depends(get_volunteer_role_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Return a paginated list of volunteer custom roles.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``volunteer-roles``.
    - **422 Unprocessable Entity** — query parameter validation failed.
    """
    result = await use_case.get_all_volunteer_roles(
        GetAllVolunteerRolesInput(
            page=page,
            page_size=page_size,
            search=search,
            is_active=is_active,
        )
    )

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.READ,
        resource_type="volunteer_custom_roles",
        resource_id=None,
        status=AuditLogStatus.SUCCESS,
        additional_context={"page": page, "page_size": page_size, "search": search, "is_active": is_active},
    )

    return {
        "success": True,
        "message": "Volunteer roles retrieved successfully.",
        "data": {
            "roles": [_serialize_volunteer_role(r) for r in result.roles],
            "total": result.total,
            "page": result.page,
            "page_size": result.page_size,
            "total_pages": result.total_pages,
        },
    }


@volunteer_role_router.patch(
    "/{role_id}",
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VOLUNTEER_ROLE_NOT_FOUND, **VOLUNTEER_ROLE_ALREADY_EXISTS, **VALIDATION_ERROR},
    summary="Update a volunteer role",
    description=(
        "Partially update a volunteer custom role. All fields are optional; "
        "omitted fields are left unchanged. Role names remain case-insensitively unique. "
        "Deactivating a role (is_active=false) prevents new volunteers from being assigned to it."
    ),
)
async def update_volunteer_role(
    request: Request,
    role_id: uuid.UUID,
    body: UpdateVolunteerRoleRequest,
    caller_id: uuid.UUID = Depends(require_permission("volunteer-roles", RoleAction.UPDATE)),
    use_case: VolunteerRoleUseCase = Depends(get_volunteer_role_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Partially update a volunteer custom role.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission on ``volunteer-roles``.
    - **404 Not Found** — no volunteer role exists for the given ID.
    - **409 Conflict** — the requested new name is already taken by another role.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    description_value = body.description if "description" in body.model_fields_set else _UNSET

    try:
        result = await use_case.update_volunteer_role(
            UpdateVolunteerRoleInput(
                role_id=role_id,
                actor_id=caller_id,
                name=body.name,
                description=description_value,
                is_active=body.is_active,
            )
        )
    except VolunteerRoleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VolunteerRoleAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.UPDATE,
        resource_type="volunteer_custom_roles",
        resource_id=str(role_id),
        status=AuditLogStatus.SUCCESS,
        new_values=_serialize_volunteer_role(result.role),
    )

    return {
        "success": True,
        "message": "Volunteer role updated successfully.",
        "data": _serialize_volunteer_role(result.role),
    }


@volunteer_role_router.delete(
    "/{role_id}",
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VOLUNTEER_ROLE_NOT_FOUND, **VALIDATION_ERROR},
    summary="Delete a volunteer role",
    description=(
        "Permanently delete a volunteer custom role. All volunteers currently assigned to this role are also removed. This operation is irreversible."
    ),
)
async def delete_volunteer_role(
    request: Request,
    role_id: uuid.UUID,
    caller_id: uuid.UUID = Depends(require_permission("volunteer-roles", RoleAction.DELETE)),
    use_case: VolunteerRoleUseCase = Depends(get_volunteer_role_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> dict:
    """Delete a volunteer custom role and cascade-remove assigned volunteers.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``volunteer-roles``.
    - **404 Not Found** — no volunteer role exists for the given ID.
    """
    try:
        result = await use_case.delete_volunteer_role(DeleteVolunteerRoleInput(role_id=role_id, actor_id=caller_id))
    except VolunteerRoleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.DELETE,
        resource_type="volunteer_custom_roles",
        resource_id=str(role_id),
        status=AuditLogStatus.SUCCESS,
        additional_context={"volunteers_removed": result.volunteers_removed},
    )

    return {
        "success": True,
        "message": "Volunteer role deleted successfully.",
        "data": {
            "role_id": str(result.role_id),
            "volunteers_removed": result.volunteers_removed,
        },
    }
