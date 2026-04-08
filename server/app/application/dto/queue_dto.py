from dataclasses import dataclass
from datetime import datetime


@dataclass
class WorkerHealthEntry:
    raw: str
    timestamp: str | None
    j_complete: int
    j_failed: int
    j_retried: int
    j_ongoing: int
    queued: int


@dataclass
class QueueStatsOutput:
    queue_name: str
    pending: int
    in_progress: int
    total_failed: int
    total_completed: int
    worker_health: list[WorkerHealthEntry]


@dataclass
class DeadJobInfo:
    job_id: str
    function: str
    args: list
    kwargs: dict
    job_try: int
    enqueue_time: datetime
    finish_time: datetime | None
    error: str


@dataclass
class ListDeadJobsOutput:
    jobs: list[DeadJobInfo]
    total: int


@dataclass
class RetryJobOutput:
    original_job_id: str
    new_job_id: str
    function: str


@dataclass
class DeleteJobOutput:
    job_id: str
    deleted: bool


@dataclass
class PurgeDeadJobsOutput:
    deleted_count: int
