"""Job queue backends.

- ``SqsJobQueue`` sends jobs to Amazon SQS; the worker Lambda consumes them.
- ``LocalJobQueue`` runs jobs in-process for local development when
  ``JOB_QUEUE_URL`` is unset, so no AWS account is needed to run the API.

Both expose the same ``enqueue_job(function, *args, **kwargs)`` call shape the
use cases already use.
"""

import asyncio
import json
import logging
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

import boto3
from botocore.config import Config

from app.application.interfaces.job_queue_interface import QueueCounts

logger = logging.getLogger(__name__)

# SQS rejects bodies above 256 KiB; fail at enqueue time with a clear error.
MAX_MESSAGE_BYTES = 256 * 1024


@dataclass(frozen=True)
class JobMessage:
    function: str
    args: list = field(default_factory=list)
    kwargs: dict = field(default_factory=dict)
    job_id: str = field(default_factory=lambda: uuid.uuid4().hex)
    enqueued_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    expires_at: datetime | None = None

    @classmethod
    def create(cls, function: str, args: tuple, kwargs: dict, *, job_id: str | None, expires: timedelta | None) -> JobMessage:
        if not function:
            raise ValueError("Job function name must not be empty")
        # Unknown options (e.g. _defer_until) would otherwise reach the job as kwargs.
        unsupported = sorted(k for k in kwargs if k.startswith("_"))
        if unsupported:
            raise ValueError(f"Unsupported job options: {', '.join(unsupported)}")
        now = datetime.now(UTC)
        return cls(
            function=function,
            args=list(args),
            kwargs=dict(kwargs),
            job_id=job_id or uuid.uuid4().hex,
            enqueued_at=now,
            expires_at=now + expires if expires else None,
        )

    def is_expired(self, now: datetime | None = None) -> bool:
        return self.expires_at is not None and (now or datetime.now(UTC)) >= self.expires_at

    def to_json(self) -> str:
        return json.dumps(
            {
                "job_id": self.job_id,
                "function": self.function,
                "args": self.args,
                "kwargs": self.kwargs,
                "enqueued_at": self.enqueued_at.isoformat(),
                "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            }
        )

    @classmethod
    def from_json(cls, raw: str) -> JobMessage:
        """Parse a message body. Scheduler messages may carry only ``function``.

        Raises:
            ValueError: The body is not a valid job message.
        """
        try:
            data = json.loads(raw)
        except (TypeError, json.JSONDecodeError) as exc:
            raise ValueError(f"Job message is not valid JSON: {exc}") from exc
        if not isinstance(data, dict):
            raise ValueError("Job message must be a JSON object")

        function = data.get("function")
        args = data.get("args")
        kwargs = data.get("kwargs")
        args = [] if args is None else args
        kwargs = {} if kwargs is None else kwargs
        if not isinstance(function, str) or not function:
            raise ValueError("Job message is missing 'function'")
        if not isinstance(args, list) or not isinstance(kwargs, dict):
            raise ValueError("Job message 'args' must be a list and 'kwargs' an object")

        return cls(
            function=function,
            args=args,
            kwargs=kwargs,
            job_id=str(data.get("job_id") or uuid.uuid4().hex),
            enqueued_at=_parse_datetime(data.get("enqueued_at")) or datetime.now(UTC),
            expires_at=_parse_datetime(data.get("expires_at")),
        )


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    if not isinstance(value, str):
        raise ValueError(f"Expected an ISO timestamp, got {value!r}")
    parsed = datetime.fromisoformat(value)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def _sqs_client():
    config = Config(connect_timeout=5, read_timeout=10, retries={"max_attempts": 3, "mode": "standard"})
    return boto3.client("sqs", config=config)


class SqsJobQueue:
    def __init__(self, queue_url: str, client=None) -> None:
        if not queue_url:
            raise ValueError("SqsJobQueue requires a queue URL")
        self.queue_url = queue_url
        self._client = client or _sqs_client()

    async def enqueue_job(
        self,
        function: str,
        *args: Any,
        _job_id: str | None = None,
        _expires: timedelta | None = None,
        **kwargs: Any,
    ) -> str:
        message = JobMessage.create(function, args, kwargs, job_id=_job_id, expires=_expires)
        body = message.to_json()
        if len(body.encode()) > MAX_MESSAGE_BYTES:
            raise ValueError(f"Job '{function}' payload exceeds the {MAX_MESSAGE_BYTES} byte SQS limit")
        await asyncio.to_thread(self._client.send_message, QueueUrl=self.queue_url, MessageBody=body)
        return message.job_id

    async def delay_retry(self, receipt_handle: str, seconds: int) -> None:
        """Hide a failed message for ``seconds`` so the next attempt backs off."""
        seconds = max(0, min(seconds, 43_200))  # SQS visibility limit is 12 hours
        await asyncio.to_thread(
            self._client.change_message_visibility,
            QueueUrl=self.queue_url,
            ReceiptHandle=receipt_handle,
            VisibilityTimeout=seconds,
        )

    async def counts(self) -> QueueCounts:
        response = await asyncio.to_thread(
            self._client.get_queue_attributes,
            QueueUrl=self.queue_url,
            AttributeNames=[
                "ApproximateNumberOfMessages",
                "ApproximateNumberOfMessagesDelayed",
                "ApproximateNumberOfMessagesNotVisible",
            ],
        )
        attrs = response.get("Attributes", {})
        return QueueCounts(
            queue_name=self.queue_url.rstrip("/").rsplit("/", 1)[-1],
            pending=int(attrs.get("ApproximateNumberOfMessages", 0)) + int(attrs.get("ApproximateNumberOfMessagesDelayed", 0)),
            in_progress=int(attrs.get("ApproximateNumberOfMessagesNotVisible", 0)),
        )

    async def aclose(self) -> None:
        return None


class LocalJobQueue:
    """Runs each job as an asyncio task in this process (local development only)."""

    def __init__(self, executor: Callable[[JobMessage], Awaitable[None]]) -> None:
        self._executor = executor
        self._tasks: set[asyncio.Task] = set()

    async def enqueue_job(
        self,
        function: str,
        *args: Any,
        _job_id: str | None = None,
        _expires: timedelta | None = None,
        **kwargs: Any,
    ) -> str:
        message = JobMessage.create(function, args, kwargs, job_id=_job_id, expires=_expires)
        task = asyncio.create_task(self._executor(message), name=f"job:{function}:{message.job_id}")
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)
        return message.job_id

    async def counts(self) -> QueueCounts:
        return QueueCounts(queue_name="local", pending=0, in_progress=len(self._tasks))

    async def aclose(self) -> None:
        tasks = list(self._tasks)
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
