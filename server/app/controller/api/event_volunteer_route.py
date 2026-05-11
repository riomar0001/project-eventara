"""Event volunteer management and participant query API routes.

Exposes endpoints for organizers to manage the volunteer roster of an event and for
both organizers and joined volunteers to view all event participants.

Access control summary:
  - Volunteer management (assign, update status, remove, list): event organizer only.
  - Participant list: event organizer OR any volunteer with JOINED status for the event.

Error mapping summary:
  - 401  missing, expired, or invalid Bearer token
  - 403  caller is not the event organizer / not a joined volunteer
  - 404  event, volunteer, or event-volunteer assignment not found
  - 409  volunteer already assigned to this event
  - 422  invalid status transition / request body failed validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.application.dto.event_volunteer_dto import (
    AssignVolunteerInput,
    GetEventParticipantsInput,
    ListEventVolunteersInput,
    RemoveEventVolunteerInput,
    UpdateEventVolunteerStatusInput,
)
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.event_volunteer_usecase import EventVolunteerUseCase
from app.controller.api.audit_helpers import safe_audit_log
from app.controller.dependencies import get_audit_log_use_case, get_current_user_id
from app.controller.dependencies.use_cases_depends import get_event_volunteer_use_case
from app.controller.docs.event_volunteer_docs import (
    EV_ALREADY_ASSIGNED,
    EV_ASSIGNMENT_NOT_FOUND,
    EV_EVENT_NOT_FOUND,
    EV_FORBIDDEN,
    EV_INVALID_TRANSITION,
    EV_UNAUTHORIZED,
    EV_VALIDATION_ERROR,
    EV_VOLUNTEER_NOT_FOUND,
    PARTICIPANTS_FORBIDDEN,
)
from app.controller.schemas.event_volunteer_schema import (
    AssignVolunteerRequest,
    EventParticipantRecord,
    EventParticipantsResponse,
    EventVolunteerListResponse,
    EventVolunteerRecordResponse,
    EventVolunteerResponse,
    PaginationMeta,
    UpdateEventVolunteerStatusRequest,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.event_entity import EventParticipant, EventVolunteer, EventVolunteerStatus
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_volunteer_exceptions import (
    EventVolunteerAlreadyExistsError,
    EventVolunteerNotFoundError,
    InvalidEventVolunteerStatusTransitionError,
    UnauthorizedEventVolunteerOperationError,
)
from app.domain.exceptions.volunteer_exceptions import VolunteerNotFoundError

event_volunteer_router = APIRouter(prefix="/events", tags=["Event Volunteers"])
event_participant_query_router = APIRouter(prefix="/events", tags=["Event Participants"])


def _serialize_event_volunteer(ev: EventVolunteer) -> dict:
    return {
        "id": str(ev.id),
        "volunteer_id": str(ev.volunteer_id),
        "event_id": str(ev.event_id),
        "status": ev.status.value if hasattr(ev.status, "value") else ev.status,
        "created_at": ev.created_at.isoformat() if ev.created_at else None,
        "updated_at": ev.updated_at.isoformat() if ev.updated_at else None,
    }


def _to_ev_record(ev: EventVolunteer) -> EventVolunteerRecordResponse:
    return EventVolunteerRecordResponse(
        id=ev.id,
        volunteer_id=ev.volunteer_id,
        event_id=ev.event_id,
        status=ev.status.value if hasattr(ev.status, "value") else ev.status,
        created_at=ev.created_at,
        updated_at=ev.updated_at,
    )


def _to_participant_record(p: EventParticipant) -> EventParticipantRecord:
    return EventParticipantRecord(
        id=p.id,
        user_id=p.user_id,
        event_session_id=p.event_session_id,
        status=p.status.value if hasattr(p.status, "value") else p.status,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@event_volunteer_router.post(
    "/{event_id}/volunteers",
    response_model=EventVolunteerResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **EV_UNAUTHORIZED,
        **EV_FORBIDDEN,
        **EV_EVENT_NOT_FOUND,
        **EV_VOLUNTEER_NOT_FOUND,
        **EV_ALREADY_ASSIGNED,
        **EV_VALIDATION_ERROR,
    },
    summary="Assign a volunteer to an event",
    description=(
        "Assign a registered volunteer to the specified event. "
        "The assignment is created with PENDING status. "
        "Only the event organizer may perform this operation. "
        "A volunteer can only be assigned to the same event once."
    ),
)
async def assign_volunteer(
    request: Request,
    event_id: uuid.UUID,
    body: AssignVolunteerRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventVolunteerUseCase = Depends(get_event_volunteer_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventVolunteerResponse:
    """Assign a volunteer to an event in one atomic transaction.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller is not the event organizer.
    - **404 Not Found** — event or volunteer does not exist.
    - **409 Conflict** — volunteer is already assigned to this event.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.assign_volunteer(
            AssignVolunteerInput(
                event_id=event_id,
                alias=body.alias,
                actor_id=user_id,
            )
        )
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UnauthorizedEventVolunteerOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except VolunteerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventVolunteerAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.CREATE,
        resource_type="event_volunteers",
        resource_id=str(result.event_volunteer.id),
        status=AuditLogStatus.SUCCESS,
        new_values=_serialize_event_volunteer(result.event_volunteer),
        additional_context={
            "event_id": str(event_id),
            "alias": body.alias,
        },
    )

    return EventVolunteerResponse(
        success=True,
        message="Volunteer assigned to event successfully.",
        data=_to_ev_record(result.event_volunteer),
    )


@event_volunteer_router.get(
    "/{event_id}/volunteers",
    response_model=EventVolunteerListResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **EV_UNAUTHORIZED,
        **EV_FORBIDDEN,
        **EV_EVENT_NOT_FOUND,
    },
    summary="List event volunteers",
    description=(
        "Retrieve all volunteer assignments for the specified event. "
        "Only the event organizer may view the volunteer roster. "
        "Optional status filter restricts results to a specific assignment state."
    ),
)
async def list_event_volunteers(
    request: Request,
    event_id: uuid.UUID,
    volunteer_status: EventVolunteerStatus | None = Query(default=None, alias="status"),
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventVolunteerUseCase = Depends(get_event_volunteer_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventVolunteerListResponse:
    """Retrieve the volunteer roster for an event.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller is not the event organizer.
    - **404 Not Found** — event does not exist.
    """
    try:
        result = await use_case.list_volunteers(
            ListEventVolunteersInput(
                event_id=event_id,
                actor_id=user_id,
                status=volunteer_status,
            )
        )
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UnauthorizedEventVolunteerOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.READ,
        resource_type="event_volunteers",
        resource_id=str(event_id),
        status=AuditLogStatus.SUCCESS,
        additional_context={"event_id": str(event_id), "filter_status": volunteer_status},
    )

    return EventVolunteerListResponse(
        success=True,
        message="Event volunteers retrieved successfully.",
        data=[_to_ev_record(ev) for ev in result.event_volunteers],
    )


@event_volunteer_router.patch(
    "/{event_id}/volunteers/{event_volunteer_id}",
    response_model=EventVolunteerResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **EV_UNAUTHORIZED,
        **EV_FORBIDDEN,
        **EV_ASSIGNMENT_NOT_FOUND,
        **EV_EVENT_NOT_FOUND,
        **EV_INVALID_TRANSITION,
        **EV_VALIDATION_ERROR,
    },
    summary="Update event volunteer status",
    description=(
        "Update the status of a volunteer assignment for an event. "
        "Only the event organizer may perform this operation. "
        "Valid transitions: PENDING → JOINED, PENDING → REJECTED, JOINED → LEFT. "
        "All other transitions are rejected."
    ),
)
async def update_event_volunteer_status(
    request: Request,
    event_id: uuid.UUID,
    event_volunteer_id: uuid.UUID,
    body: UpdateEventVolunteerStatusRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventVolunteerUseCase = Depends(get_event_volunteer_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventVolunteerResponse:
    """Update an event-volunteer status in one atomic transaction.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller is not the event organizer.
    - **404 Not Found** — event-volunteer assignment or parent event does not exist.
    - **422 Unprocessable Entity** — invalid status transition or request body validation failure.
    """
    try:
        result = await use_case.update_volunteer_status(
            UpdateEventVolunteerStatusInput(
                event_volunteer_id=event_volunteer_id,
                actor_id=user_id,
                new_status=body.status,
            )
        )
    except EventVolunteerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UnauthorizedEventVolunteerOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except InvalidEventVolunteerStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="event_volunteers",
        resource_id=str(event_volunteer_id),
        status=AuditLogStatus.SUCCESS,
        old_values={"status": result.old_status.value},
        new_values=_serialize_event_volunteer(result.event_volunteer),
        additional_context={
            "event_id": str(event_id),
            "status_transition": f"{result.old_status.value} → {result.event_volunteer.status.value}",
        },
    )

    return EventVolunteerResponse(
        success=True,
        message="Event volunteer status updated successfully.",
        data=_to_ev_record(result.event_volunteer),
    )


@event_volunteer_router.delete(
    "/{event_id}/volunteers/{event_volunteer_id}",
    response_model=EventVolunteerResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **EV_UNAUTHORIZED,
        **EV_FORBIDDEN,
        **EV_ASSIGNMENT_NOT_FOUND,
        **EV_EVENT_NOT_FOUND,
    },
    summary="Remove a volunteer from an event",
    description=(
        "Remove a volunteer assignment from the specified event. "
        "Only the event organizer may perform this operation. "
        "Returns the deleted assignment record."
    ),
)
async def remove_event_volunteer(
    request: Request,
    event_id: uuid.UUID,
    event_volunteer_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventVolunteerUseCase = Depends(get_event_volunteer_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventVolunteerResponse:
    """Remove a volunteer from an event in one atomic transaction.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller is not the event organizer.
    - **404 Not Found** — event-volunteer assignment or parent event does not exist.
    """
    try:
        result = await use_case.remove_volunteer(
            RemoveEventVolunteerInput(
                event_volunteer_id=event_volunteer_id,
                actor_id=user_id,
            )
        )
    except EventVolunteerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UnauthorizedEventVolunteerOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.DELETE,
        resource_type="event_volunteers",
        resource_id=str(event_volunteer_id),
        status=AuditLogStatus.SUCCESS,
        old_values=_serialize_event_volunteer(result.event_volunteer),
        additional_context={"event_id": str(event_id)},
    )

    return EventVolunteerResponse(
        success=True,
        message="Volunteer removed from event successfully.",
        data=_to_ev_record(result.event_volunteer),
    )


@event_participant_query_router.get(
    "/{event_id}/participants",
    response_model=EventParticipantsResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **EV_UNAUTHORIZED,
        **PARTICIPANTS_FORBIDDEN,
        **EV_EVENT_NOT_FOUND,
    },
    summary="Get all event participants",
    description=(
        "Retrieve all participants across all sessions of the specified event. "
        "Access is granted to the event organizer and to any volunteer with JOINED "
        "status for this event. "
        "Optional status filter restricts results to a specific participant state. "
        "Results are paginated via limit and offset query parameters."
    ),
)
async def get_event_participants(
    request: Request,
    event_id: uuid.UUID,
    participant_status: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventVolunteerUseCase = Depends(get_event_volunteer_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventParticipantsResponse:
    """Retrieve all participants for an event in a single read operation.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller is neither the event organizer nor a JOINED volunteer.
    - **404 Not Found** — event does not exist.
    """
    try:
        result = await use_case.get_participants(
            GetEventParticipantsInput(
                event_id=event_id,
                actor_id=user_id,
                status=participant_status,
                limit=limit,
                offset=offset,
            )
        )
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except UnauthorizedEventVolunteerOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.READ,
        resource_type="event_participants",
        resource_id=str(event_id),
        status=AuditLogStatus.SUCCESS,
        additional_context={
            "event_id": str(event_id),
            "filter_status": participant_status,
            "total": result.total,
        },
    )

    return EventParticipantsResponse(
        success=True,
        message="Event participants retrieved successfully.",
        data=[_to_participant_record(p) for p in result.participants],
        meta=PaginationMeta(total=result.total, limit=limit, offset=offset),
    )
