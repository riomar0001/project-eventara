from fastapi import status

APP_FEEDBACK_RATE_LIMITED = {
    status.HTTP_429_TOO_MANY_REQUESTS: {
        "description": "IP-based rate limit exceeded — too many submissions within the current window",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Too many feedback submissions. Try again in 3540 second(s).",
                }
            }
        },
    }
}

APP_FEEDBACK_VALIDATION_ERROR = {
    status.HTTP_422_UNPROCESSABLE_ENTITY: {
        "description": "Request payload failed validation — rating must be 1–5, comment max 2 000 characters",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Validation failed.",
                    "errors": [],
                }
            }
        },
    }
}

APP_FEEDBACK_UNAUTHORIZED = {
    status.HTTP_401_UNAUTHORIZED: {
        "description": "Invalid or expired token",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Token has expired",
                }
            }
        },
    }
}

APP_FEEDBACK_FORBIDDEN = {
    status.HTTP_403_FORBIDDEN: {
        "description": "Insufficient permissions — requires App Feedback READ permission",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "You do not have permission to access this resource",
                }
            }
        },
    }
}

APP_FEEDBACK_SERVER_ERROR = {
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "description": "Unexpected server failure",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "An unexpected error occurred",
                }
            }
        },
    }
}
