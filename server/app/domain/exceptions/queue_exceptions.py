class JobNotFoundError(Exception):
    def __init__(self, job_id: str) -> None:
        super().__init__(f"Job '{job_id}' not found in the dead-letter queue")


class JobNotDeadError(Exception):
    def __init__(self, job_id: str) -> None:
        super().__init__(f"Job '{job_id}' is not a failed job and cannot be managed via the DLQ")


class JobRetryConflictError(Exception):
    def __init__(self, job_id: str) -> None:
        super().__init__(f"Job '{job_id}' is already being retried — please wait and try again")


class QueueInspectionError(Exception):
    def __init__(self, message: str = "Failed to inspect queue state") -> None:
        super().__init__(message)
