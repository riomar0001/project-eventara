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
