from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_dto import (
    DeleteEventInput,
    DeleteEventOutput,
    DeleteEventSessionInput,
    DeleteEventSessionOutput,
)
from app.domain.exceptions.event_exceptions import (
    EventNotFoundError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventLastSessionError,
    EventSessionNotFoundError,
)
from app.infrastructure.database.repositories.event_repository import EventRepository


class EventDeletionUseCase:
    def __init__(self, event_repo: EventRepository, db: AsyncSession) -> None:
        self.event_repo = event_repo
        self.db = db

    async def delete_event(self, data: DeleteEventInput) -> DeleteEventOutput:
        async with self.db.begin():
            event = await self.event_repo.get_event_by_id(data.event_id, for_update=True)
            if event is None:
                raise EventNotFoundError(str(data.event_id))
            if event.created_by != data.deleted_by:
                raise UnauthorizedEventOperationError(str(data.event_id))
            await self.event_repo.delete_event(data.event_id)
            return DeleteEventOutput(event=event)

    async def delete_event_session(self, data: DeleteEventSessionInput) -> DeleteEventSessionOutput:
        async with self.db.begin():
            event = await self.event_repo.get_event_by_id(data.event_id, for_update=True)
            if event is None:
                raise EventNotFoundError(str(data.event_id))
            if event.created_by != data.deleted_by:
                raise UnauthorizedEventOperationError(str(data.event_id))
            session = await self.event_repo.get_session_by_id(data.session_id)
            if session is None or session.event_id != data.event_id:
                raise EventSessionNotFoundError(str(data.session_id))
            session_count = await self.event_repo.count_sessions_by_event_id(data.event_id)
            if session_count <= 1:
                raise EventLastSessionError(str(data.event_id))
            await self.event_repo.delete_session(data.session_id)
            return DeleteEventSessionOutput(session=session)
