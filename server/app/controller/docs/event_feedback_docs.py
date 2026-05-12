from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

EVENT_FEEDBACK_UNAUTHORIZED = {
    401: {
        "description": "Missing or invalid Bearer token",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Token has expired"}}},
    }
}

EVENT_FEEDBACK_EVENT_NOT_FOUND = {
    404: {
        "description": "Event not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Event not found"}}},
    }
}

EVENT_FEEDBACK_NOT_OPEN = {
    400: {
        "description": "Feedback is not open until the event has ended",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Feedback is not open for this event"}}},
    }
}

EVENT_FEEDBACK_NOT_ELIGIBLE = {
    403: {
        "description": "Only checked-in attendees may submit feedback",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Only checked-in attendees can submit feedback"}}},
    }
}

EVENT_FEEDBACK_DUPLICATE = {
    409: {
        "description": "User already submitted feedback for this event",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "User has already submitted feedback for this event"}}},
    }
}

EVENT_FEEDBACK_VALIDATION_ERROR = {
    422: {
        "description": "Request body failed schema validation",
        "model": ValidationErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Validation failed."}}},
    }
}
