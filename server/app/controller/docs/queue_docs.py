from fastapi import status

QUEUE_UNAUTHORIZED = {
    status.HTTP_401_UNAUTHORIZED: {
        "description": "Invalid or expired token",
        "content": {
            "application/json": {
                "example": {"success": False, "message": "Token has expired"}
            }
        },
    }
}

QUEUE_FORBIDDEN = {
    status.HTTP_403_FORBIDDEN: {
        "description": "Insufficient permissions to manage queues",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Role 'viewer' does not have 'read' access to 'queues'.",
                }
            }
        },
    }
}

QUEUE_JOB_NOT_FOUND = {
    status.HTTP_404_NOT_FOUND: {
        "description": "Job not found in the dead-letter queue",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Job 'abc123' not found in the dead-letter queue",
                }
            }
        },
    }
}

QUEUE_JOB_NOT_DEAD = {
    status.HTTP_409_CONFLICT: {
        "description": "Job is not a failed job and cannot be managed via the DLQ",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Job 'abc123' is not a failed job and cannot be managed via the DLQ",
                }
            }
        },
    }
}

QUEUE_RETRY_CONFLICT = {
    status.HTTP_409_CONFLICT: {
        "description": "A concurrent retry for the same job is already in progress",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Job 'abc123' is already being retried — please wait and try again",
                }
            }
        },
    }
}

QUEUE_INTERNAL_ERROR = {
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "description": "Unexpected Redis or ARQ error during queue inspection",
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Failed to inspect queue state: Connection refused",
                }
            }
        },
    }
}
