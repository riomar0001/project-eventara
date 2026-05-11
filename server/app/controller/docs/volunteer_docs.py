from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

UNAUTHORIZED = {
    401: {
        "description": "Missing or invalid Bearer token",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Token has expired"}}},
    }
}

FORBIDDEN = {
    403: {
        "description": "Insufficient permissions",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Role 'participant' does not have 'create' access to 'volunteers'.",
                }
            }
        },
    }
}

VOLUNTEER_ALREADY_EXISTS = {
    409: {
        "description": "User is already a volunteer",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Volunteer already exists for user"}}},
    }
}

VOLUNTEER_ROLE_NOT_FOUND = {
    404: {
        "description": "Volunteer custom role not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Volunteer role not found"}}},
    }
}

VOLUNTEER_ROLE_ALREADY_EXISTS = {
    409: {
        "description": "Volunteer role with that name already exists",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Volunteer role already exists"}}},
    }
}

USER_NOT_FOUND = {
    404: {
        "description": "Target user not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "User not found"}}},
    }
}

VALIDATION_ERROR = {
    422: {
        "description": "Request body failed schema validation",
        "model": ValidationErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Validation failed."}}},
    }
}

APPLICATION_NOT_FOUND = {
    404: {
        "description": "Volunteer application not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Volunteer application not found"}}},
    }
}

APPLICATION_ALREADY_EXISTS = {
    409: {
        "description": "User already has an active volunteer application",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "An active volunteer application already exists"}}},
    }
}

INVALID_APPLICATION_TRANSITION = {
    422: {
        "description": "Application status transition is not permitted",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Cannot transition application <id> from 'approved' to 'withdrawn'",
                }
            }
        },
    }
}

UNAUTHORIZED_APPLICATION_OPERATION = {
    403: {
        "description": "Caller is not the owner of the application",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "You do not have permission to perform this operation on this application",
                }
            }
        },
    }
}

VOLUNTEER_NOT_FOUND = {
    404: {
        "description": "Volunteer record not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Volunteer not found"}}},
    }
}

VOLUNTEER_ROLE_DELETE_CONFLICT = {
    409: {
        "description": "Volunteer role cannot be deleted due to a conflict",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {"success": False, "message": "Volunteer role already exists: <name>"}
            }
        },
    }
}
