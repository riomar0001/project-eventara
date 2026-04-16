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
        "description": "Insufficient permissions or target account is inactive",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "examples": {
                    "permissions": {
                        "summary": "Insufficient permissions",
                        "value": {
                            "success": False,
                            "message": "Role 'participant' does not have 'update' access to 'user-accounts'.",
                        },
                    },
                    "inactive": {
                        "summary": "Inactive or deleted account",
                        "value": {
                            "success": False,
                            "message": "Account is inactive or has been deleted",
                        },
                    },
                }
            }
        },
    }
}

USER_NOT_FOUND = {
    404: {
        "description": "User not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "User not found"}}},
    }
}

ROLE_NOT_FOUND = {
    404: {
        "description": "Role not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Role not found"}}},
    }
}

ROLE_ALREADY_CURRENT = {
    409: {
        "description": "Requested role is already current",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "This role is already the user's current effective role",
                }
            }
        },
    }
}

EMAIL_CONFLICT = {
    409: {
        "description": "Email conflict",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "examples": {
                    "same_email": {
                        "summary": "Same email as current",
                        "value": {
                            "success": False,
                            "message": "The new email address must be different from the current email",
                        },
                    },
                    "already_taken": {
                        "summary": "Email already taken",
                        "value": {
                            "success": False,
                            "message": "Email 'user@example.com' is already registered",
                        },
                    },
                }
            }
        },
    }
}

PASSWORD_RESET_CONFLICT = {
    409: {
        "description": "Target user cannot receive a password reset email",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "The user's email address must be verified before sending a password reset link",
                }
            }
        },
    }
}

LIST_VALIDATION_ERROR = {
    422: {
        "description": "Validation error for pagination parameters",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["query", "page"],
                            "msg": "Input should be greater than or equal to 1",
                            "type": "greater_than_equal",
                        }
                    ],
                }
            }
        },
    }
}

ROLE_CHANGE_VALIDATION_ERROR = {
    422: {
        "description": "Validation error for role change payload",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "role_id"],
                            "msg": "Input should be a valid UUID",
                            "type": "uuid_parsing",
                        }
                    ],
                }
            }
        },
    }
}

EMAIL_CHANGE_VALIDATION_ERROR = {
    422: {
        "description": "Validation error for email change payload",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "email"],
                            "msg": "value is not a valid email address",
                            "type": "value_error.email",
                        }
                    ],
                }
            }
        },
    }
}
