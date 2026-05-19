"""Data-access layer for venue ratings.

All write methods flush changes within the current transaction boundary.
The use-case layer owns commit and rollback.

Concurrency strategy — SELECT … FOR UPDATE (pessimistic locking):
    ``get_by_user_and_venue`` accepts a ``for_update`` flag that acquires a
    row-level write lock.  The use case calls this before any create, update, or
    delete to serialize concurrent requests from the same user on the same venue.
    This eliminates the TOCTOU window between the existence check and the
    mutation.  The unique composite index on ``(user_id, venue_id)`` acts as a
    final integrity guard for cross-session races on create.

    Popularity counters on ``venues`` are updated atomically within the same
    transaction as the rating mutation so the aggregate never drifts out of sync.
"""

import uuid

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func as sqlfunc

from app.domain.entities.venue_entities import VenueRating as VenueRatingEntity
from app.infrastructure.database.models.venue_models import Venue, VenueRating


class VenueRatingRepository:
    """Data-access layer for venue rating records."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _to_entity(orm: VenueRating) -> VenueRatingEntity:
        """Map a VenueRating ORM row to its domain entity."""
        return VenueRatingEntity(
            id=orm.id,
            user_id=orm.user_id,
            venue_id=orm.venue_id,
            rating=orm.rating,
            comment=orm.comment,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    async def venue_exists(self, venue_id: uuid.UUID) -> bool:
        """Return True when a venue row with the given ID exists."""
        result = await self.db.execute(select(Venue.id).where(Venue.id == venue_id))
        return result.scalar_one_or_none() is not None

    async def get_by_user_and_venue(
        self,
        user_id: uuid.UUID,
        venue_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> VenueRatingEntity | None:
        """Return the rating submitted by a specific user for a specific venue.

        When ``for_update=True`` a ``SELECT … FOR UPDATE`` lock is acquired so
        concurrent requests cannot both read a missing row and both proceed to
        create a duplicate, and so concurrent update/delete requests are
        serialised.
        """
        query = select(VenueRating).where(
            VenueRating.user_id == user_id,
            VenueRating.venue_id == venue_id,
        )
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_entity(orm) if orm else None

    async def list_by_venue(
        self,
        venue_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[VenueRatingEntity], int]:
        """Return a paginated slice of ratings for a venue, newest first."""
        count_result = await self.db.execute(select(func.count(VenueRating.id)).where(VenueRating.venue_id == venue_id))
        total = count_result.scalar_one()

        data_result = await self.db.execute(
            select(VenueRating)
            .where(VenueRating.venue_id == venue_id)
            .order_by(VenueRating.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = data_result.scalars().all()
        return [self._to_entity(row) for row in rows], total

    async def list_by_venue_public(
        self,
        venue_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[tuple[VenueRatingEntity, str]], int]:
        """Return paginated ratings with the submitter's alias, newest first."""
        count_result = await self.db.execute(select(func.count(VenueRating.id)).where(VenueRating.venue_id == venue_id))
        total = count_result.scalar_one()

        data_result = await self.db.execute(
            select(VenueRating)
            .options(selectinload(VenueRating.user))
            .where(VenueRating.venue_id == venue_id)
            .order_by(VenueRating.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = data_result.scalars().all()
        return [(self._to_entity(row), row.user.alias) for row in rows], total

    async def create(
        self,
        user_id: uuid.UUID,
        venue_id: uuid.UUID,
        rating: int,
        comment: str | None,
    ) -> VenueRatingEntity:
        """Insert a new rating row and return the persisted record."""
        orm = VenueRating(user_id=user_id, venue_id=venue_id, rating=rating, comment=comment)
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_entity(orm)

    async def update(
        self,
        user_id: uuid.UUID,
        venue_id: uuid.UUID,
        *,
        rating: int,
        comment: str | None,
    ) -> VenueRatingEntity | None:
        """Update the rating and comment for an existing record.

        Returns ``None`` when no matching row exists.  ``updated_at`` is set
        explicitly via ``func.now()`` because Core-level UPDATE statements do not
        trigger SQLAlchemy's ``onupdate`` hook automatically.
        """
        result = await self.db.execute(
            update(VenueRating)
            .where(VenueRating.user_id == user_id, VenueRating.venue_id == venue_id)
            .values(rating=rating, comment=comment, updated_at=sqlfunc.now())
            .returning(
                VenueRating.id,
                VenueRating.user_id,
                VenueRating.venue_id,
                VenueRating.rating,
                VenueRating.comment,
                VenueRating.created_at,
                VenueRating.updated_at,
            )
        )
        row = result.one_or_none()
        if row is None:
            return None
        return VenueRatingEntity(
            id=row.id,
            user_id=row.user_id,
            venue_id=row.venue_id,
            rating=row.rating,
            comment=row.comment,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    async def delete(self, user_id: uuid.UUID, venue_id: uuid.UUID) -> bool:
        """Delete the rating owned by a user for a venue. Returns True when a row was removed."""
        result = await self.db.execute(
            delete(VenueRating).where(
                VenueRating.user_id == user_id,
                VenueRating.venue_id == venue_id,
            )
        )
        return result.rowcount > 0

    async def get_average_rating(self, venue_id: uuid.UUID) -> tuple[float | None, int]:
        """Return the mean rating and total count for a venue in one round-trip."""
        result = await self.db.execute(select(func.avg(VenueRating.rating), func.count(VenueRating.id)).where(VenueRating.venue_id == venue_id))
        row = result.one()
        avg = float(row[0]) if row[0] is not None else None
        count = int(row[1])
        return avg, count

    async def increment_venue_popularity(self, venue_id: uuid.UUID) -> None:
        """Atomically increment the venue's popularity counter by one."""
        await self.db.execute(update(Venue).where(Venue.id == venue_id).values(popularity_count=Venue.popularity_count + 1))

    async def decrement_venue_popularity(self, venue_id: uuid.UUID) -> None:
        """Atomically decrement the venue's popularity counter, guarded at zero."""
        await self.db.execute(
            update(Venue).where(Venue.id == venue_id, Venue.popularity_count > 0).values(popularity_count=Venue.popularity_count - 1)
        )
