from datetime import datetime

from pydantic import BaseModel


class WorkerHealthEntrySchema(BaseModel):
    raw: str
    timestamp: str | None
    j_complete: int
    j_failed: int
    j_retried: int
    j_ongoing: int
    queued: int


class QueueStatsResponse(BaseModel):
    success: bool = True
    queue_name: str
    pending: int
    in_progress: int
    total_failed: int
    total_completed: int
    worker_health: list[WorkerHealthEntrySchema]


class DeadJobResponse(BaseModel):
    job_id: str
    function: str
    args: list
    kwargs: dict
    job_try: int
    enqueue_time: datetime
    finish_time: datetime | None
    error: str


class ListDeadJobsResponse(BaseModel):
    success: bool = True
    data: list[DeadJobResponse]
    total: int


class RetryJobResponse(BaseModel):
    success: bool = True
    original_job_id: str
    new_job_id: str
    function: str


class DeleteJobResponse(BaseModel):
    success: bool = True
    job_id: str
    deleted: bool


class PurgeDeadJobsResponse(BaseModel):
    success: bool = True
    deleted_count: int
