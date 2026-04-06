from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

UNAUTHORIZED = {
    401: {
        "description": "Missing or invalid Bearer token",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {"success": False, "message": "Token has expired"}
            }
        },
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
                    "message": "Role 'member' does not have 'create' access to 'user-roles'.",
                }
            }
        },
    }
}

USER_NOT_FOUND = {
    404: {
        "description": "Target user not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {"success": False, "message": "User not found"}
            }
        },
    }
}

ROLE_NOT_FOUND = {
    404: {
        "description": "Role not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {"success": False, "message": "Role not found"}
            }
        },
    }
}

ASSIGNMENT_NOT_FOUND = {
    404: {
        "description": "Role assignment not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {"success": False, "message": "Role assignment not found"}
            }
        },
    }
}

ROLE_ALREADY_ASSIGNED = {
    409: {
        "description": "Role already assigned to this user",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "This role is already assigned to the user",
                }
            }
        },
    }
}

FEATURE_NOT_FOUND = {
    404: {
        "description": "Feature not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {"success": False, "message": "Feature not found"}
            }
        },
    }
}

GRANT_NOT_FOUND = {
    404: {
        "description": "User grant not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {"success": False, "message": "User grant not found"}
            }
        },
    }
}

DUPLICATE_GRANT = {
    409: {
        "description": "One or more grants already exist",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Grants already exist for actions: read, create",
                }
            }
        },
    }
}

ASSIGN_ROLE_VALIDATION_ERROR = {
    422: {
        "description": "Validation error",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "user_id"],
                            "msg": "Input should be a valid UUID",
                            "type": "uuid_parsing",
                        }
                    ],
                }
            }
        },
    }
}

CREATE_GRANTS_VALIDATION_ERROR = {
    422: {
        "description": "Validation error",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "actions"],
                            "msg": "List should have at least 1 item",
                            "type": "too_short",
                        }
                    ],
                }
            }
        },
    }
}
