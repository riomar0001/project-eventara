"""Event management API routes.

Exposes endpoints for creating events, updating event metadata, updating
individual event sessions, manually transitioning event or session statuses,
and physically deleting events or sessions that are still in a deletable state.
Authentication and RBAC permissions are required for every event operation.
Ownership checks still apply to creator-only mutations.

Error mapping summary:
  - 400  date, business-rule, invalid status transition, ineligible venue, or deletion-not-allowed
  - 401  missing, expired, or invalid Bearer token
  - 403  caller is not the event creator (update/delete only)
  - 404  event, session, or venue not found
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.application.dto.event_dto import (
    CreateEventInput,
    CreateEventSessionForEventInput,
    CreateEventSessionInput,
    DeleteEventInput,
    DeleteEventSessionInput,
    GetAllEventsInput,
    GetEventWithSessionsInput,
    GetPublicEventsInput,
    UpdateEventBannerInput,
    UpdateEventMetadataInput,
    UpdateEventSessionInput,
)
from app.application.dto.event_status_dto import UpdateEventSessionStatusInput, UpdateEventStatusInput
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.event_deletion_usecase import EventDeletionUseCase
from app.application.use_cases.event_query_usecase import GetEventUseCase
from app.application.use_cases.event_status_usecase import EventStatusUseCase
from app.application.use_cases.event_usecase import EventUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_event, serialize_event_sessions
from app.controller.dependencies import get_audit_log_use_case, get_caller_role, require_permission
from app.controller.dependencies.storage_depends import get_storage_service
from app.controller.dependencies.use_cases_depends import (
    get_event_deletion_use_case,
    get_event_query_use_case,
    get_event_status_use_case,
    get_event_use_case,
)
from app.controller.docs.event_docs import (
    EVENT_BANNER_STORAGE_UNAVAILABLE,
    EVENT_BANNER_UPLOAD_OPENAPI_EXTRA,
    EVENT_CREATE_OPENAPI_EXTRA,
    EVENT_DATE_INVALID,
    EVENT_DELETION_NOT_ALLOWED,
    EVENT_DETAIL_QUERY_EXAMPLE,
    EVENT_GET_NOT_FOUND,
    EVENT_LIST_QUERY_EXAMPLE,
    EVENT_METADATA_DATE_INVALID,
    EVENT_METADATA_NOT_FOUND,
    EVENT_NOT_FOUND,
    EVENT_SESSION_DATE_INVALID,
    EVENT_SESSION_DELETION_NOT_ALLOWED,
    EVENT_SESSION_NOT_FOUND,
    EVENT_SESSION_STATUS_INVALID_TRANSITION,
    EVENT_STATUS_INVALID_TRANSITION,
    EVENT_UNAUTHORIZED_OPERATION,
    EVENT_UPDATE_OPENAPI_EXTRA,
    EVENT_VALIDATION_ERROR,
    EVENT_VENUE_NOT_PARTNER,
    UNAUTHORIZED,
)
from app.controller.schemas.event_schema import (
    EventBannerUploadData,
    EventBannerUploadRequest,
    EventBannerUploadResponse,
    EventCreateRequest,
    EventDeletedResponse,
    EventDetailResponse,
    EventListResponse,
    EventMetadataUpdatedResponse,
    EventRecordResponse,
    EventSessionCreatedResponse,
    EventSessionCreateRequest,
    EventSessionDeletedResponse,
    EventSessionRecordResponse,
    EventSessionStatusUpdatedResponse,
    EventSessionStatusUpdateRequest,
    EventSessionUpdatedResponse,
    EventSessionUpdateRequest,
    EventStatusUpdatedResponse,
    EventStatusUpdateRequest,
    EventUpdateRequest,
    EventWithSessionsResponse,
    HomeEventsData,
    HomeEventsResponse,
    HomeEventWithSessions,
    LiveEventData,
    PublicEventDetailResponse,
    PublicEventsListData,
    PublicEventsListResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.authorization_entities import RoleAction
from app.domain.entities.event_entity import Event as EventEntity
from app.domain.entities.event_entity import EventSession as EventSessionEntity
from app.domain.entities.event_entity import EventStatus
from app.domain.exceptions.event_exceptions import (
    EventDateValidationError,
    EventDeletionNotAllowedError,
    EventNotFoundError,
    EventStatusTransitionError,
    EventValidationError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventLastSessionError,
    EventSessionDeletionNotAllowedError,
    EventSessionExceedsEventBoundsError,
    EventSessionNotFoundError,
    EventSessionStatusTransitionError,
    InvalidEventSessionDateError,
)
from app.domain.exceptions.venue_exceptions import VenueNotFoundError, VenueNotPartnerError
from app.infrastructure.storage.storage_service import StorageService

event_router = APIRouter(prefix="/events", tags=["Events"])


def _to_event_response(event: EventEntity) -> EventRecordResponse:
    return EventRecordResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        status=event.status.value if hasattr(event.status, "value") else event.status,
        created_by=event.created_by,
        banner_url=StorageService.public_url_for_object_key(event.banner_url),
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


def _to_session_response(session: EventSessionEntity) -> EventSessionRecordResponse:
    return EventSessionRecordResponse(
        id=session.id,
        event_id=session.event_id,
        venue_id=session.venue_id,
        venue_name=session.venue_name,
        venue_location=session.venue_location,
        title=session.title,
        description=session.description,
        start_datetime=session.start_datetime,
        end_datetime=session.end_datetime,
        status=session.status.value if hasattr(session.status, "value") else session.status,
        max_slots=session.max_slots,
        registered_count=session.registered_count,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@event_router.get(
    "/public",
    response_model=PublicEventsListResponse,
    status_code=status.HTTP_200_OK,
    summary="Public events directory listing",
    description=(
        "Returns a paginated list of upcoming events (status=posted) for the public events directory. "
        "Falls back to past events (status=ended) when no upcoming events exist. "
        "Supports optional title search via the ``q`` parameter. "
        "No authentication required."
    ),
)
async def get_public_events(
    q: str | None = Query(default=None, description="Case-insensitive title search"),
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(default=9, ge=1, le=50, description="Items per page (max 50)"),
    use_case: GetEventUseCase = Depends(get_event_query_use_case),
) -> PublicEventsListResponse:
    """Return paginated upcoming or past events for the public events directory."""
    result = await use_case.get_public_events(GetPublicEventsInput(q=q, page=page, page_size=page_size))

    return PublicEventsListResponse(
        data=PublicEventsListData(
            events=[
                HomeEventWithSessions(
                    id=record.event.id,
                    title=record.event.title,
                    description=record.event.description,
                    start_date=record.event.start_date,
                    end_date=record.event.end_date,
                    status=record.event.status.value if hasattr(record.event.status, "value") else record.event.status,
                    banner_url=StorageService.public_url_for_object_key(record.event.banner_url),
                    sessions=[_to_session_response(s) for s in record.sessions],
                )
                for record in result.events
            ],
            total=result.total,
            page=result.page,
            page_size=result.page_size,
            total_pages=result.total_pages,
            events_type=result.events_type,
        )
    )


@event_router.get(
    "/public/home",
    response_model=HomeEventsResponse,
    status_code=status.HTTP_200_OK,
    summary="Public home page events",
    description=(
        "Returns the currently live event (status=started) with its sessions, "
        "plus a list of upcoming events (status=posted). "
        "When no upcoming events exist, falls back to the most-recent past events (status=ended). "
        "No authentication required."
    ),
)
async def get_home_events(
    use_case: GetEventUseCase = Depends(get_event_query_use_case),
) -> HomeEventsResponse:
    """Return live event and upcoming (or fallback past) events for the public home page."""
    result = await use_case.get_home_events()

    live_event_data: LiveEventData | None = None
    if result.live_event:
        live_event_data = LiveEventData(
            event=_to_event_response(result.live_event),
            sessions=[_to_session_response(s) for s in result.live_event_sessions],
        )

    return HomeEventsResponse(
        data=HomeEventsData(
            live_event=live_event_data,
            events=[
                HomeEventWithSessions(
                    id=record.event.id,
                    title=record.event.title,
                    description=record.event.description,
                    start_date=record.event.start_date,
                    end_date=record.event.end_date,
                    status=record.event.status.value if hasattr(record.event.status, "value") else record.event.status,
                    banner_url=StorageService.public_url_for_object_key(record.event.banner_url),
                    sessions=[_to_session_response(s) for s in record.sessions],
                )
                for record in result.events
            ],
            events_type=result.events_type,
        )
    )


@event_router.get(
    "/public/{event_id}",
    response_model=PublicEventDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Public event detail",
    description=(
        "Returns a single event with all its sessions. "
        "No authentication required."
    ),
)
async def get_public_event_detail(
    event_id: uuid.UUID,
    use_case: GetEventUseCase = Depends(get_event_query_use_case),
) -> PublicEventDetailResponse:
    """Return a single public event with its sessions."""
    try:
        result = await use_case.get_event_with_sessions(GetEventWithSessionsInput(event_id=event_id))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return PublicEventDetailResponse(
        data=HomeEventWithSessions(
            id=result.event.id,
            title=result.event.title,
            description=result.event.description,
            start_date=result.event.start_date,
            end_date=result.event.end_date,
            status=result.event.status.value if hasattr(result.event.status, "value") else result.event.status,
            banner_url=StorageService.public_url_for_object_key(result.event.banner_url),
            sessions=[_to_session_response(s) for s in result.sessions],
        )
    )


@event_router.get(
    "",
    response_model=EventListResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **EVENT_LIST_QUERY_EXAMPLE},
    summary="List all events",
    description=(
        "Returns a paginated list of events ordered by creation date descending. "
        "Optionally filter by event status. "
        "Page size is capped at 100 regardless of the supplied value."
    ),
)
async def get_all_events(
    request: Request,
    event_status: EventStatus | None = Query(default=None, alias="status", description="Filter by event status"),
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page (max 100)"),
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.READ)),
    use_case: GetEventUseCase = Depends(get_event_query_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventListResponse:
    """Return a paginated list of all events with optional status filtering."""
    result = await use_case.get_all_events(GetAllEventsInput(page=page, page_size=page_size, status=event_status))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.READ,
        resource_type="events",
        resource_id=None,
        status=AuditLogStatus.SUCCESS,
        additional_context={
            "filter_status": event_status.value if event_status else None,
            "page": page,
            "page_size": result.page_size,
            "total": result.total,
        },
    )

    return EventListResponse(
        data=[_to_event_response(e) for e in result.events],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        total_pages=result.total_pages,
    )


@event_router.get(
    "/{event_id}",
    response_model=EventDetailResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **EVENT_GET_NOT_FOUND, **EVENT_DETAIL_QUERY_EXAMPLE},
    summary="Get an event with all its sessions",
    description=("Returns a single event together with all its sessions ordered by start time. Authentication is required."),
)
async def get_event_with_sessions(
    request: Request,
    event_id: uuid.UUID,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.READ)),
    use_case: GetEventUseCase = Depends(get_event_query_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventDetailResponse:
    """Return a single event and its ordered sessions list."""
    try:
        result = await use_case.get_event_with_sessions(GetEventWithSessionsInput(event_id=event_id))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.READ,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        additional_context={"session_count": len(result.sessions)},
    )

    return EventDetailResponse(
        data=_to_event_response(result.event),
        sessions=[_to_session_response(s) for s in result.sessions],
    )


@event_router.post(
    "",
    response_model=EventWithSessionsResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **EVENT_NOT_FOUND, **EVENT_VENUE_NOT_PARTNER, **EVENT_DATE_INVALID, **EVENT_VALIDATION_ERROR},
    summary="Create a new event with sessions",
    description=(
        "Creates an event and its associated sessions atomically. "
        "At least one session is required. "
        "Session date windows must fall within the event date range. "
        "Session venues must be partnered venues. "
        "An optional ``banner_url`` may be supplied when the banner has already been uploaded through the feature-specific banner endpoint. "
        "The event description accepts raw HTML produced by a WYSIWYG editor."
    ),
    openapi_extra=EVENT_CREATE_OPENAPI_EXTRA,
)
async def create_event(
    request: Request,
    body: EventCreateRequest,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.CREATE)),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventWithSessionsResponse:
    """Create an event together with all initial sessions in one transaction."""
    session_inputs = [
        CreateEventSessionInput(
            venue_id=s.venue_id,
            title=s.title,
            description=s.description,
            start_datetime=s.start_datetime,
            end_datetime=s.end_datetime,
            max_slots=s.max_slots,
        )
        for s in body.sessions
    ]

    try:
        result = await use_case.create_event(
            CreateEventInput(
                title=body.title,
                description=body.description,
                start_date=body.start_date,
                end_date=body.end_date,
                created_by=user_id,
                banner_url=StorageService.object_key_from_public_url(body.banner_url),
                sessions=session_inputs,
            )
        )
    except (
        EventDateValidationError,
        EventValidationError,
        InvalidEventSessionDateError,
        EventSessionExceedsEventBoundsError,
        VenueNotPartnerError,
    ) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.CREATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        new_values={
            **serialize_event(result.event),
            "sessions": serialize_event_sessions(result.sessions),
        },
        additional_context={"session_count": len(result.sessions)},
    )

    return EventWithSessionsResponse(
        data=_to_event_response(result.event),
        sessions=[_to_session_response(s) for s in result.sessions],
    )


@event_router.patch(
    "/{event_id}",
    response_model=EventMetadataUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_METADATA_DATE_INVALID,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update event metadata",
    description=(
        "Updates an event's title, description, date range, and optional banner object key. "
        "Only the event creator may perform this operation. "
        "The event description accepts raw HTML produced by a WYSIWYG editor. "
        "When dates change, the event's clock-derived lifecycle status is recalculated."
    ),
    openapi_extra=EVENT_UPDATE_OPENAPI_EXTRA,
)
async def update_event_metadata(
    request: Request,
    event_id: uuid.UUID,
    body: EventUpdateRequest,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.UPDATE)),
    caller_role: str | None = Depends(get_caller_role),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventMetadataUpdatedResponse:
    """Update an event's metadata fields in a single atomic transaction."""
    try:
        result = await use_case.update_event_metadata(
            UpdateEventMetadataInput(
                event_id=event_id,
                updated_by=user_id,
                title=body.title,
                description=body.description,
                start_date=body.start_date,
                end_date=body.end_date,
                banner_url=StorageService.object_key_from_public_url(body.banner_url),
                caller_role=caller_role,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventDateValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event(result.old_event),
        new_values=serialize_event(result.event),
    )

    return EventMetadataUpdatedResponse(data=_to_event_response(result.event))


@event_router.patch(
    "/{event_id}/session/{session_id}",
    response_model=EventSessionUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_SESSION_NOT_FOUND,
        **EVENT_VENUE_NOT_PARTNER,
        **EVENT_SESSION_DATE_INVALID,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update an event session",
    description=(
        "Updates a single event session by its ID. "
        "Only the creator of the parent event may perform this operation. "
        "The session date window must fall within the parent event's date range, and the venue must be partnered."
    ),
)
async def update_event_session(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    body: EventSessionUpdateRequest,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.UPDATE)),
    caller_role: str | None = Depends(get_caller_role),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventSessionUpdatedResponse:
    """Update an event session's fields in a single atomic transaction."""
    try:
        result = await use_case.update_event_session(
            UpdateEventSessionInput(
                session_id=session_id,
                updated_by=user_id,
                venue_id=body.venue_id,
                title=body.title,
                description=body.description,
                start_datetime=body.start_datetime,
                end_datetime=body.end_datetime,
                max_slots=body.max_slots,
                caller_role=caller_role,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (EventSessionNotFoundError, VenueNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (InvalidEventSessionDateError, EventSessionExceedsEventBoundsError, VenueNotPartnerError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="event_sessions",
        resource_id=str(result.session.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_sessions([result.old_session])[0],
        new_values=serialize_event_sessions([result.session])[0],
    )

    return EventSessionUpdatedResponse(data=_to_session_response(result.session))


@event_router.post(
    "/{event_id}/session",
    response_model=EventSessionCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_SESSION_NOT_FOUND,
        **EVENT_VENUE_NOT_PARTNER,
        **EVENT_SESSION_DATE_INVALID,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Create an event session",
    description=(
        "Creates a single session for an existing event. "
        "Only the event creator may perform this operation. "
        "The session date window must fall within the parent event date range, and the venue must be partnered."
    ),
)
async def create_event_session(
    request: Request,
    event_id: uuid.UUID,
    body: EventSessionCreateRequest,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.CREATE)),
    caller_role: str | None = Depends(get_caller_role),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventSessionCreatedResponse:
    """Create a new session on an existing event in a single atomic transaction."""
    try:
        result = await use_case.create_event_session(
            CreateEventSessionForEventInput(
                event_id=event_id,
                updated_by=user_id,
                venue_id=body.venue_id,
                title=body.title,
                description=body.description,
                start_datetime=body.start_datetime,
                end_datetime=body.end_datetime,
                max_slots=body.max_slots,
                caller_role=caller_role,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (InvalidEventSessionDateError, EventSessionExceedsEventBoundsError, VenueNotPartnerError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.CREATE,
        resource_type="event_sessions",
        resource_id=str(result.session.id),
        status=AuditLogStatus.SUCCESS,
        new_values=serialize_event_sessions([result.session])[0],
        additional_context={"event_id": str(event_id)},
    )

    return EventSessionCreatedResponse(data=_to_session_response(result.session))


@event_router.patch(
    "/{event_id}/status",
    response_model=EventStatusUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_STATUS_INVALID_TRANSITION,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update event status",
    description=(
        "Manually transitions an event to a new status. "
        "Only the event creator may perform this operation. "
        "Allowed transitions: DRAFT → POSTED | CANCELLED; "
        "POSTED → STARTED | CANCELLED | POSTPONED; "
        "STARTED → ENDED | CANCELLED; "
        "POSTPONED → POSTED | CANCELLED. "
        "ENDED and CANCELLED are terminal states with no further transitions."
    ),
)
async def update_event_status(
    request: Request,
    event_id: uuid.UUID,
    body: EventStatusUpdateRequest,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.UPDATE)),
    caller_role: str | None = Depends(get_caller_role),
    use_case: EventStatusUseCase = Depends(get_event_status_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventStatusUpdatedResponse:
    """Transition an event status through the allowed state machine in one atomic transaction."""
    try:
        result = await use_case.update_event_status(
            UpdateEventStatusInput(
                event_id=event_id,
                updated_by=user_id,
                new_status=body.new_status,
                caller_role=caller_role,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event(result.old_event),
        new_values=serialize_event(result.event),
        additional_context={"status_transition": f"{result.old_event.status} → {result.event.status}"},
    )

    return EventStatusUpdatedResponse(data=_to_event_response(result.event))


@event_router.patch(
    "/{event_id}/session/{session_id}/status",
    response_model=EventSessionStatusUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_SESSION_NOT_FOUND,
        **EVENT_SESSION_STATUS_INVALID_TRANSITION,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update event session status",
    description=(
        "Manually transitions an event session to a new status. "
        "Only the creator of the parent event may perform this operation. "
        "Allowed transitions: DRAFT → POSTED | CANCELLED; "
        "POSTED → STARTED | CANCELLED | POSTPONED; "
        "STARTED → ENDED | CANCELLED; "
        "POSTPONED → POSTED | CANCELLED. "
        "ENDED and CANCELLED are terminal states with no further transitions."
    ),
)
async def update_event_session_status(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    body: EventSessionStatusUpdateRequest,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.UPDATE)),
    caller_role: str | None = Depends(get_caller_role),
    use_case: EventStatusUseCase = Depends(get_event_status_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventSessionStatusUpdatedResponse:
    """Transition an event session status through the allowed state machine in one atomic transaction."""
    try:
        result = await use_case.update_event_session_status(
            UpdateEventSessionStatusInput(
                session_id=session_id,
                updated_by=user_id,
                new_status=body.new_status,
                caller_role=caller_role,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (EventSessionNotFoundError, EventNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventSessionStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="event_sessions",
        resource_id=str(result.session.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_sessions([result.old_session])[0],
        new_values=serialize_event_sessions([result.session])[0],
        additional_context={"status_transition": f"{result.old_session.status} → {result.session.status}"},
    )

    return EventSessionStatusUpdatedResponse(data=_to_session_response(result.session))


@event_router.delete(
    "/{event_id}",
    response_model=EventDeletedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_DELETION_NOT_ALLOWED,
    },
    summary="Delete an event",
    description=(
        "Permanently deletes an event and all its sessions. "
        "Only the event creator may perform this operation. "
        "Deletion is only permitted when the event status is DRAFT or CANCELLED. "
        "All child sessions and participant records are removed via database cascade."
    ),
)
async def delete_event(
    request: Request,
    event_id: uuid.UUID,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.DELETE)),
    caller_role: str | None = Depends(get_caller_role),
    use_case: EventDeletionUseCase = Depends(get_event_deletion_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventDeletedResponse:
    """Delete an event in one atomic transaction; cascades to all child sessions."""
    try:
        result = await use_case.delete_event(DeleteEventInput(event_id=event_id, deleted_by=user_id, caller_role=caller_role))
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventDeletionNotAllowedError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.DELETE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event(result.event),
        additional_context={"deleted_status": result.event.status.value if hasattr(result.event.status, "value") else result.event.status},
    )

    return EventDeletedResponse(data=_to_event_response(result.event))


@event_router.delete(
    "/{event_id}/session/{session_id}",
    response_model=EventSessionDeletedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_SESSION_NOT_FOUND,
        **EVENT_SESSION_DELETION_NOT_ALLOWED,
    },
    summary="Delete an event session",
    description=(
        "Permanently deletes a single event session. "
        "Only the event creator may perform this operation. "
        "Deletion is only permitted when the session status is DRAFT or CANCELLED. "
        "The event must have at least one other session remaining after deletion. "
        "All participant records for the session are removed via database cascade."
    ),
)
async def delete_event_session(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.DELETE)),
    caller_role: str | None = Depends(get_caller_role),
    use_case: EventDeletionUseCase = Depends(get_event_deletion_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventSessionDeletedResponse:
    """Delete a single event session in one atomic transaction."""
    try:
        result = await use_case.delete_event_session(
            DeleteEventSessionInput(session_id=session_id, event_id=event_id, deleted_by=user_id, caller_role=caller_role)
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (EventSessionDeletionNotAllowedError, EventLastSessionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.DELETE,
        resource_type="event_sessions",
        resource_id=str(result.session.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_sessions([result.session])[0],
        additional_context={
            "event_id": str(event_id),
            "deleted_status": result.session.status.value if hasattr(result.session.status, "value") else result.session.status,
        },
    )

    return EventSessionDeletedResponse(data=_to_session_response(result.session))


@event_router.post(
    "/{event_id}/banner",
    response_model=EventBannerUploadResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_BANNER_STORAGE_UNAVAILABLE,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Generate a presigned URL to upload the event banner",
    description=(
        "Generates a short-lived presigned PUT URL for uploading an event banner image directly to object storage, "
        "bypassing the API server for the binary transfer. "
        "The banner's object key is stored on the event immediately; the caller must PUT the image to ``upload_url`` "
        "within the expiry window (3600 s). "
        "Only the event creator may perform this operation. "
        "Allowed content types: ``image/jpeg``, ``image/png``, ``image/webp``, ``image/gif``."
    ),
    openapi_extra=EVENT_BANNER_UPLOAD_OPENAPI_EXTRA,
)
async def upload_event_banner(
    request: Request,
    event_id: uuid.UUID,
    body: EventBannerUploadRequest,
    user_id: uuid.UUID = Depends(require_permission("events", RoleAction.UPDATE)),
    caller_role: str | None = Depends(get_caller_role),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
    storage: StorageService = Depends(get_storage_service),
) -> EventBannerUploadResponse:
    """Generate a presigned banner upload URL and persist the resulting object key on the event."""
    try:
        upload_url, object_key, public_url, expires_in = storage.generate_presigned_upload(
            resource_type="event-cover-banner",
            content_type=body.content_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    try:
        result = await use_case.update_event_banner(
            UpdateEventBannerInput(
                event_id=event_id,
                updated_by=user_id,
                banner_url=object_key,
                caller_role=caller_role,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="events",
        resource_id=str(event_id),
        status=AuditLogStatus.SUCCESS,
        old_values={"banner_file": result.old_banner_url},
        new_values={"banner_file": object_key},
        additional_context={"public_url": public_url},
    )

    return EventBannerUploadResponse(
        data=_to_event_response(result.event),
        upload=EventBannerUploadData(
            upload_url=upload_url,
            object_key=object_key,
            public_url=public_url,
            expires_in=expires_in,
        ),
    )
