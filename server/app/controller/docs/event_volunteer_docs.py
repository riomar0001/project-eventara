from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

EV_UNAUTHORIZED = {
    401: {
        "description": "Missing or invalid Bearer token",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Token has expired"}}},
    }
}

EV_FORBIDDEN = {
    403: {
        "description": "Caller is not the event organizer",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "You do not have permission to perform this operation on this event volunteer",
                }
            }
        },
    }
}

EV_EVENT_NOT_FOUND = {
    404: {
        "description": "Event not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Event not found"}}},
    }
}

EV_VOLUNTEER_NOT_FOUND = {
    404: {
        "description": "Volunteer not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Volunteer not found"}}},
    }
}

EV_ASSIGNMENT_NOT_FOUND = {
    404: {
        "description": "Event-volunteer assignment not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Event volunteer not found"}}},
    }
}

EV_ALREADY_ASSIGNED = {
    409: {
        "description": "Volunteer is already assigned to this event",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Volunteer <id> is already registered for event <id>",
                }
            }
        },
    }
}

EV_INVALID_TRANSITION = {
    422: {
        "description": "Requested status transition is not allowed from the current state",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Cannot transition event volunteer <id> from rejected to joined",
                }
            }
        },
    }
}

EV_VALIDATION_ERROR = {
    422: {
        "description": "Request body failed schema validation",
        "model": ValidationErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Validation failed."}}},
    }
}

PARTICIPANTS_FORBIDDEN = {
    403: {
        "description": "Caller is neither the event organizer nor a joined volunteer",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "You do not have permission to view participants for this event",
                }
            }
        },
    }
}
