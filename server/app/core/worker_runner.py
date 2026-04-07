from arq import Worker

from app.infrastructure.messaging.worker import WorkerSettings, shutdown, startup


def create_worker() -> Worker:
    return Worker(
        functions=WorkerSettings.functions,
        cron_jobs=WorkerSettings.cron_jobs,
        redis_settings=WorkerSettings.redis_settings,
        on_startup=startup,
        on_shutdown=shutdown,
        max_tries=WorkerSettings.max_tries,
        handle_signals=False,
    )
