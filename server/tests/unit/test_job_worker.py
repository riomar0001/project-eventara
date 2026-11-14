"""Unit tests for job messages, the SQS batch processor and the local executor."""

import asyncio
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest

from app.infrastructure.messaging import worker
from app.infrastructure.messaging.dead_jobs import DeadJobStore
from app.infrastructure.messaging.job_queue import JobMessage, LocalJobQueue
from tests.fake_redis import FakeRedis


def _record(body: str, receive_count: int = 1, message_id: str = "m1") -> dict:
    return {
        "messageId": message_id,
        "receiptHandle": "rh",
        "body": body,
        "attributes": {"ApproximateReceiveCount": str(receive_count)},
        "eventSource": "aws:sqs",
    }


def _body(function: str = "fake_job", **kwargs) -> str:
    return JobMessage.create(function, (), kwargs, job_id="job-1", expires=None).to_json()


@pytest.fixture
def fake_job():
    job = AsyncMock()
    with patch.dict(worker.JOBS, {"fake_job": job}):
        yield job


async def _process(records, queue=None):
    store = DeadJobStore(FakeRedis())
    failures = await worker.process_sqs_records(records, redis=FakeRedis(), dead_jobs=store, queue=queue)
    return failures, store


# ─── JobMessage ──────────────────────────────────────────────────────────────


def test_message_round_trips_through_json():
    message = JobMessage.create("send_email_job", ("x",), {"to": "a@b.com"}, job_id=None, expires=timedelta(hours=1))
    parsed = JobMessage.from_json(message.to_json())
    assert (parsed.function, parsed.args, parsed.kwargs, parsed.job_id) == ("send_email_job", ["x"], {"to": "a@b.com"}, message.job_id)
    assert parsed.expires_at == message.expires_at


def test_scheduler_message_needs_only_function():
    parsed = JobMessage.from_json('{"function": "sync_event_statuses_job"}')
    assert parsed.function == "sync_event_statuses_job" and parsed.job_id and parsed.args == []


@pytest.mark.parametrize("raw", ["not json", "[]", "{}", '{"function": ""}', '{"function": "f", "args": {}}'])
def test_invalid_message_bodies_are_rejected(raw):
    with pytest.raises(ValueError):
        JobMessage.from_json(raw)


def test_unsupported_underscore_options_are_rejected():
    with pytest.raises(ValueError):
        JobMessage.create("f", (), {"_defer_until": "tomorrow"}, job_id=None, expires=None)


def test_every_enqueued_and_scheduled_job_is_registered():
    names = {"send_email_job", "persist_audit_log"} | {name for name, _ in worker.LOCAL_SCHEDULES}
    assert names <= worker.JOBS.keys()


# ─── process_sqs_records ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_successful_job_is_acknowledged(fake_job):
    failures, store = await _process([_record(_body(to="a@b.com"))])
    assert failures == []
    fake_job.assert_awaited_once()
    assert fake_job.await_args.kwargs == {"to": "a@b.com"}
    assert await store.completed_count() == 1


@pytest.mark.asyncio
async def test_failure_before_last_try_is_redelivered_with_backoff(fake_job):
    fake_job.side_effect = RuntimeError("boom")
    queue = AsyncMock()
    failures, store = await _process([_record(_body(), receive_count=1)], queue=queue)
    assert failures == ["m1"]
    queue.delay_retry.assert_awaited_once_with("rh", worker.retry_delay_seconds(1))
    assert await store.count() == 0


@pytest.mark.asyncio
async def test_final_failure_is_recorded_and_acknowledged(fake_job):
    fake_job.side_effect = RuntimeError("boom")
    failures, store = await _process([_record(_body(), receive_count=worker.settings.JOB_MAX_TRIES)])
    assert failures == []
    dead = await store.get("job-1")
    assert dead is not None and dead.function == "fake_job" and "boom" in dead.error


@pytest.mark.asyncio
async def test_final_failure_left_to_sqs_when_store_unavailable(fake_job):
    fake_job.side_effect = RuntimeError("boom")
    with patch.object(DeadJobStore, "record", AsyncMock(side_effect=ConnectionError("redis down"))):
        failures, _ = await _process([_record(_body(), receive_count=worker.settings.JOB_MAX_TRIES)])
    assert failures == ["m1"]


@pytest.mark.asyncio
async def test_unknown_job_goes_straight_to_dead_store():
    failures, store = await _process([_record(_body("does_not_exist"))])
    assert failures == []
    assert (await store.get("job-1")).function == "does_not_exist"


@pytest.mark.asyncio
async def test_malformed_body_is_parked():
    failures, store = await _process([_record("garbage", message_id="bad")])
    assert failures == []
    assert (await store.get("bad")).function == "<invalid message>"


@pytest.mark.asyncio
async def test_expired_job_is_skipped(fake_job):
    expired = JobMessage(function="fake_job", job_id="old", expires_at=datetime.now(UTC) - timedelta(seconds=1))
    failures, _ = await _process([_record(expired.to_json())])
    assert failures == []
    fake_job.assert_not_awaited()


@pytest.mark.asyncio
async def test_one_bad_record_does_not_fail_the_batch(fake_job):
    fake_job.side_effect = [RuntimeError("boom"), None]
    failures, _ = await _process([_record(_body(), message_id="a"), _record(_body(), message_id="b")])
    assert failures == ["a"]


def test_retry_delay_is_exponential_and_capped():
    base = worker.settings.JOB_RETRY_BASE_SECONDS
    assert worker.retry_delay_seconds(1) == base
    assert worker.retry_delay_seconds(2) == min(base * 2, 900)
    assert worker.retry_delay_seconds(50) == 900


# ─── Local executor ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_local_job_retries_then_records_dead(fake_job):
    fake_job.side_effect = RuntimeError("boom")
    store = DeadJobStore(FakeRedis())
    with patch("app.infrastructure.messaging.worker.asyncio.sleep", AsyncMock()):
        await worker.run_local_job(JobMessage(function="fake_job", job_id="j"), redis=FakeRedis(), dead_jobs=store)
    assert fake_job.await_count == worker.settings.JOB_MAX_TRIES
    assert await store.get("j") is not None


@pytest.mark.asyncio
async def test_local_queue_runs_job_in_background(fake_job):
    store = DeadJobStore(FakeRedis())

    async def executor(message):
        await worker.run_local_job(message, redis=FakeRedis(), dead_jobs=store)

    queue = LocalJobQueue(executor)
    await queue.enqueue_job("fake_job", to="x@y.z")
    assert (await queue.counts()).in_progress == 1
    await asyncio.gather(*list(queue._tasks))
    fake_job.assert_awaited_once()
    assert fake_job.await_args.kwargs == {"to": "x@y.z"}
    assert (await queue.counts()).in_progress == 0


def test_local_schedules_match_terraform_scheduler():
    """LOCAL_SCHEDULES (local dev) and scheduler.tf (AWS) must run the same jobs."""
    import re
    from pathlib import Path

    tf = Path(__file__).resolve().parents[3] / "infra" / "terraform" / "scheduler.tf"
    if not tf.exists():
        pytest.skip("infra/terraform is not available in this checkout")
    tf_jobs = set(re.findall(r'function\s*=\s*"([a-z_]+)"', tf.read_text(encoding="utf-8")))
    assert tf_jobs == {name for name, _ in worker.LOCAL_SCHEDULES}


@pytest.mark.asyncio
async def test_jobs_receive_the_queue_in_their_context(fake_job):
    queue = AsyncMock()
    await worker.execute_job(JobMessage(function="fake_job"), attempt=1, redis=FakeRedis(), jobs=queue)
    assert fake_job.await_args.args[0]["jobs"] is queue
