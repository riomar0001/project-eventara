"""Queue management routes.

Exposes read and administrative endpoints for the ARQ job queue and its
dead-letter store.  All routes require an authenticated caller with RBAC
permission on the ``queues`` feature:

  - ``read``   — required for GET endpoints (stats and DLQ listing)
  - ``delete`` — required for POST retry and DELETE operations

Dead-letter queue (DLQ): ARQ does not have a native DLQ — jobs that exhaust
``max_tries`` have their final failure persisted in ``arq:result:{job_id}``
with ``success=False``.  These endpoints treat that set of keys as the DLQ.

Error mapping summary:
  - 401  token missing / expired / invalid
  - 403  RBAC denial
  - 404  job result key not found or already expired
  - 409  job is not failed, or concurrent retry already in progress
  - 500  Redis / ARQ communication failure
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.use_cases.queue_usecase import (
    DeleteDeadJobUseCase,
    GetQueueStatsUseCase,
    ListDeadJobsUseCase,
    PurgeDeadJobsUseCase,
    RetryDeadJobUseCase,
)
from app.controller.dependencies import require_permission
from app.controller.dependencies.use_cases_depends import (
    get_delete_dead_job_use_case,
    get_list_dead_jobs_use_case,
    get_purge_dead_jobs_use_case,
    get_queue_stats_use_case,
    get_retry_dead_job_use_case,
)
from app.controller.docs.queue_docs import (
    QUEUE_FORBIDDEN,
    QUEUE_INTERNAL_ERROR,
    QUEUE_JOB_NOT_DEAD,
    QUEUE_JOB_NOT_FOUND,
    QUEUE_RETRY_CONFLICT,
    QUEUE_UNAUTHORIZED,
)
from app.controller.schemas.queue_schema import (
    DeadJobResponse,
    DeleteJobResponse,
    ListDeadJobsResponse,
    PurgeDeadJobsResponse,
    QueueStatsResponse,
    RetryJobResponse,
    WorkerHealthEntrySchema,
)
from app.domain.entities.authorization_entities import RoleAction
from app.domain.exceptions.queue_exceptions import (
    JobNotDeadError,
    JobNotFoundError,
    JobRetryConflictError,
    QueueInspectionError,
)

router = APIRouter(prefix="/queues", tags=["Queue"])


@router.get(
    "",
    response_model=QueueStatsResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **QUEUE_UNAUTHORIZED,
        **QUEUE_FORBIDDEN,
        **QUEUE_INTERNAL_ERROR,
    },
    summary="Get queue statistics",
    description=(
        "Returns a live snapshot of the ARQ job queue, including pending, "
        "in-progress, completed, and failed job counts, along with the last "
        "known worker heartbeat entries from the health-check sorted set.\n\n"
        "**Requires** ``read`` permission on the ``queues`` feature."
    ),
)
async def get_queue_stats(
    _: object = Depends(require_permission("queues", RoleAction.READ)),
    use_case: GetQueueStatsUseCase = Depends(get_queue_stats_use_case),
) -> QueueStatsResponse:
    """Return a live queue activity snapshot.

    Queries Redis directly for pending job counts, in-progress key counts,
    and deserialises all stored results to partition them into completed and
    failed totals.  Worker heartbeat entries from ``arq:queue:health-check``
    are parsed and returned as structured objects.

    Error mapping:
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``queues``.
    - **500 Internal Server Error** — Redis connection failure or ARQ error.
    """
    try:
        output = await use_case.execute()
        return QueueStatsResponse(
            queue_name=output.queue_name,
            pending=output.pending,
            in_progress=output.in_progress,
            total_failed=output.total_failed,
            total_completed=output.total_completed,
            worker_health=[
                WorkerHealthEntrySchema(
                    raw=h.raw,
                    timestamp=h.timestamp,
                    j_complete=h.j_complete,
                    j_failed=h.j_failed,
                    j_retried=h.j_retried,
                    j_ongoing=h.j_ongoing,
                    queued=h.queued,
                )
                for h in output.worker_health
            ],
        )
    except QueueInspectionError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get(
    "/dlq",
    response_model=ListDeadJobsResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **QUEUE_UNAUTHORIZED,
        **QUEUE_FORBIDDEN,
        **QUEUE_INTERNAL_ERROR,
    },
    summary="List dead-letter queue jobs",
    description=(
        "Returns all jobs that exhausted their retry budget and ended in a "
        "permanent failure state.  Each entry includes the original function "
        "name, serialised arguments, retry count, and the last exception "
        "message.\n\n"
        "**Requires** ``read`` permission on the ``queues`` feature."
    ),
)
async def list_dead_jobs(
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    limit: int = Query(default=10, ge=1, le=100, description="Items per page"),
    _: object = Depends(require_permission("queues", RoleAction.READ)),
    use_case: ListDeadJobsUseCase = Depends(get_list_dead_jobs_use_case),
) -> ListDeadJobsResponse:
    """List permanently failed jobs in the dead-letter store with pagination.

    Scans ``arq:result:*`` and returns entries where ``JobResult.success``
    is ``False``, sliced to the requested page.  Results that have already
    expired (ARQ TTL elapsed) will not appear in this list.

    Error mapping:
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``queues``.
    - **500 Internal Server Error** — Redis or deserialisation failure.
    """
    try:
        output = await use_case.execute(page=page, limit=limit)
        return ListDeadJobsResponse(
            data=[
                DeadJobResponse(
                    job_id=j.job_id,
                    function=j.function,
                    args=j.args,
                    kwargs=j.kwargs,
                    job_try=j.job_try,
                    enqueue_time=j.enqueue_time,
                    finish_time=j.finish_time,
                    error=j.error,
                )
                for j in output.jobs
            ],
            total=output.total,
            page=output.page,
            limit=output.limit,
            total_pages=output.total_pages,
        )
    except QueueInspectionError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post(
    "/dlq/{job_id}/retry",
    response_model=RetryJobResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **QUEUE_UNAUTHORIZED,
        **QUEUE_FORBIDDEN,
        **QUEUE_JOB_NOT_FOUND,
        **QUEUE_JOB_NOT_DEAD,
        **QUEUE_RETRY_CONFLICT,
        **QUEUE_INTERNAL_ERROR,
    },
    summary="Retry a dead-letter job",
    description=(
        "Re-enqueues a failed job with its original function name and arguments, "
        "then removes it from the dead-letter store.  A distributed Redis lock "
        "prevents duplicate enqueue if two callers submit the same ``job_id`` "
        "simultaneously.\n\n"
        "**Requires** ``delete`` permission on the ``queues`` feature."
    ),
)
async def retry_dead_job(
    job_id: str,
    _: object = Depends(require_permission("queues", RoleAction.DELETE)),
    use_case: RetryDeadJobUseCase = Depends(get_retry_dead_job_use_case),
) -> RetryJobResponse:
    """Re-enqueue a failed job from the dead-letter store.

    Acquires a ``SET NX EX 30`` lock on ``arq:dlq:retry-lock:{job_id}`` to
    serialise concurrent retry requests.  On success, the original result key
    is deleted and a new job is placed on the default queue with a fresh retry
    counter.

    Error mapping:
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``queues``.
    - **404 Not Found** — job result absent or TTL expired.
    - **409 Conflict** — job succeeded (not in DLQ) or concurrent retry active.
    - **500 Internal Server Error** — unexpected Redis or ARQ failure.
    """
    try:
        output = await use_case.execute(job_id)
        return RetryJobResponse(
            original_job_id=output.original_job_id,
            new_job_id=output.new_job_id,
            function=output.function,
        )
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (JobNotDeadError, JobRetryConflictError) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except QueueInspectionError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.delete(
    "/dlq/{job_id}",
    response_model=DeleteJobResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **QUEUE_UNAUTHORIZED,
        **QUEUE_FORBIDDEN,
        **QUEUE_JOB_NOT_FOUND,
        **QUEUE_JOB_NOT_DEAD,
        **QUEUE_INTERNAL_ERROR,
    },
    summary="Delete a dead-letter job",
    description=(
        "Permanently removes a single failed job from the dead-letter store.  "
        "The job must exist and have ``success=False`` — successfully completed "
        "jobs cannot be deleted through this endpoint.\n\n"
        "**Requires** ``delete`` permission on the ``queues`` feature."
    ),
)
async def delete_dead_job(
    job_id: str,
    _: object = Depends(require_permission("queues", RoleAction.DELETE)),
    use_case: DeleteDeadJobUseCase = Depends(get_delete_dead_job_use_case),
) -> DeleteJobResponse:
    """Delete a single failed job from the dead-letter store.

    Confirms the job exists and has failed before issuing the atomic ``DEL``
    command on ``arq:result:{job_id}``.

    Error mapping:
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``queues``.
    - **404 Not Found** — job result absent or TTL expired.
    - **409 Conflict** — job succeeded and is not a DLQ candidate.
    - **500 Internal Server Error** — unexpected Redis failure.
    """
    try:
        output = await use_case.execute(job_id)
        return DeleteJobResponse(job_id=output.job_id, deleted=output.deleted)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except JobNotDeadError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except QueueInspectionError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.delete(
    "/dlq",
    response_model=PurgeDeadJobsResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **QUEUE_UNAUTHORIZED,
        **QUEUE_FORBIDDEN,
        **QUEUE_INTERNAL_ERROR,
    },
    summary="Purge all dead-letter jobs",
    description=(
        "Bulk-deletes every failed job from the dead-letter store in a single "
        "operation.  Jobs that complete between the scan and the delete pass "
        "will not be affected.  This action is **irreversible**.\n\n"
        "**Requires** ``delete`` permission on the ``queues`` feature."
    ),
)
async def purge_dead_jobs(
    _: object = Depends(require_permission("queues", RoleAction.DELETE)),
    use_case: PurgeDeadJobsUseCase = Depends(get_purge_dead_jobs_use_case),
) -> PurgeDeadJobsResponse:
    """Purge all failed jobs from the dead-letter store.

    Collects all ``arq:result:*`` keys where ``success=False``, then issues a
    single batched ``DEL`` for efficiency.  Returns the number of keys deleted.

    Error mapping:
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``queues``.
    - **500 Internal Server Error** — Redis scan or delete failure.
    """
    try:
        output = await use_case.execute()
        return PurgeDeadJobsResponse(deleted_count=output.deleted_count)
    except QueueInspectionError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
