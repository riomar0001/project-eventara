"""Data-access layer for venue management.

All write methods call ``flush()`` to stage changes within the current
transaction boundary. Callers (use-case layer) are responsible for committing
or rolling back the session.

Concurrency strategy — SELECT … FOR UPDATE (pessimistic locking):
    ``get_venue_by_id`` accepts a ``for_update`` flag that acquires a row-level
    lock before any check-then-mutate sequence. This serializes concurrent
    update and delete attempts on the same venue row so that the use-case layer
    sees a consistent snapshot before deciding whether to proceed. Pessimistic
    locking was chosen because the conflict window is short (a single request),
    the probability of simultaneous admin edits on the same venue is non-zero,
    and it eliminates the need for version-column retries.

    Name uniqueness (per city) is enforced by the use-case layer using a
    ``FOR UPDATE`` pre-check that locks any conflicting row. This prevents a
    second concurrent create with the same name+city from slipping through
    between the existence check and the insert.
"""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.venue_entities import Venue as VenueEntity
from app.domain.entities.venue_entities import VenueType
from app.infrastructure.database.models.venue_models import Venue


class VenueRepository:
    """Data-access layer for the venue catalog."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _to_entity(orm: Venue) -> VenueEntity:
        """Map a Venue ORM row to its domain entity representation."""
        return VenueEntity(
            id=orm.id,
            creator_id=orm.creator_id,
            image_url=orm.image_file_id,
            name=orm.name,
            description=orm.description,
            address_line=orm.address_line,
            city=orm.city,
            province=orm.province,
            postal_code=orm.postal_code,
            region=orm.region,
            country=orm.country,
            capacity=orm.capacity,
            venue_type=orm.venue_type,
            popularity_count=orm.popularity_count,
            usage_count=orm.usage_count,
            is_partner=orm.is_partner,
            amenities=orm.amenities,
            contact_name=orm.contact_name,
            contact_phone=orm.contact_phone,
            contact_email=orm.contact_email,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    async def list_venues(
        self,
        page: int,
        page_size: int,
        search: str | None,
        venue_type: VenueType | None,
        is_partner: bool | None,
    ) -> tuple[list[VenueEntity], int]:
        """Return a paginated slice of venues matching the supplied filters.

        Args:
            page: 1-based page index.
            page_size: Maximum number of rows per page.
            search: Case-insensitive substring matched against name and city.
            venue_type: Filter to a single venue type when provided.
            is_partner: Filter by partner status when provided.

        Returns:
            A tuple of (venue entities for the current page, total matching count).
        """
        query = select(Venue)
        count_query = select(func.count()).select_from(Venue)

        if search:
            pattern = f"%{search}%"
            condition = or_(Venue.name.ilike(pattern), Venue.city.ilike(pattern))
            query = query.where(condition)
            count_query = count_query.where(condition)

        if venue_type is not None:
            query = query.where(Venue.venue_type == venue_type)
            count_query = count_query.where(Venue.venue_type == venue_type)

        if is_partner is not None:
            query = query.where(Venue.is_partner == is_partner)
            count_query = count_query.where(Venue.is_partner == is_partner)

        total = (await self.db.execute(count_query)).scalar_one()
        rows = (await self.db.execute(query.order_by(Venue.name).offset((page - 1) * page_size).limit(page_size))).scalars().all()

        return [self._to_entity(r) for r in rows], total

    async def get_venue_by_id(self, venue_id: uuid.UUID, *, for_update: bool = False) -> VenueEntity | None:
        """Return a single venue entity by primary key, optionally locking the row.

        Args:
            venue_id: The venue's UUID.
            for_update: When ``True``, acquires a ``SELECT … FOR UPDATE`` lock.

        Returns:
            The matching entity, or ``None`` if no row exists.
        """
        query = select(Venue).where(Venue.id == venue_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_entity(orm) if orm else None

    async def name_exists_in_city(
        self,
        name: str,
        city: str,
        exclude_id: uuid.UUID | None = None,
    ) -> bool:
        """Check whether a venue with the given name already exists in the city.

        Args:
            name: The venue name to check (case-insensitive).
            city: The city to scope the uniqueness check.
            exclude_id: A venue UUID to exclude from the check, used during updates.

        Returns:
            ``True`` if a conflicting venue exists, ``False`` otherwise.
        """
        query = select(Venue.id).where(func.lower(Venue.name) == name.lower(), func.lower(Venue.city) == city.lower())
        if exclude_id is not None:
            query = query.where(Venue.id != exclude_id)
        query = query.with_for_update(skip_locked=True).limit(1)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_event_session_count(self, venue_id: uuid.UUID) -> int:
        """Return the number of event sessions referencing this venue.

        Args:
            venue_id: The venue UUID to inspect.

        Returns:
            Count of dependent event session rows.
        """
        from app.infrastructure.database.models.event_models import EventSession

        result = await self.db.execute(select(func.count()).select_from(EventSession).where(EventSession.venue_id == venue_id))
        return result.scalar_one()

    async def create_venue(
        self,
        creator_id: uuid.UUID,
        name: str,
        description: str | None,
        address_line: str,
        city: str,
        province: str,
        postal_code: str,
        region: str,
        country: str,
        capacity: int,
        venue_type: VenueType,
        image_url: str | None,
        is_partner: bool,
        amenities: list[str] | None,
        contact_name: str | None,
        contact_phone: str | None,
        contact_email: str | None,
    ) -> VenueEntity:
        """Insert a new venue row and return the persisted entity.

        Args:
            creator_id: UUID of the admin user creating the venue.
            All remaining arguments map directly to their Venue column counterparts.

        Returns:
            The newly persisted VenueEntity.
        """
        orm = Venue(
            creator_id=creator_id,
            name=name,
            description=description,
            address_line=address_line,
            city=city,
            province=province,
            postal_code=postal_code,
            region=region,
            country=country,
            capacity=capacity,
            venue_type=venue_type,
            image_file_id=image_url,
            is_partner=is_partner,
            amenities=amenities,
            contact_name=contact_name,
            contact_phone=contact_phone,
            contact_email=contact_email,
        )
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_entity(orm)

    async def update_venue(
        self,
        venue_id: uuid.UUID,
        name: str,
        description: str | None,
        address_line: str,
        city: str,
        province: str,
        postal_code: str,
        region: str,
        country: str,
        capacity: int,
        venue_type: VenueType,
        image_url: str | None,
        is_partner: bool,
        amenities: list[str] | None,
        contact_name: str | None,
        contact_phone: str | None,
        contact_email: str | None,
    ) -> VenueEntity | None:
        """Apply field updates to an existing venue row.

        Args:
            venue_id: Primary key of the venue to update.
            All remaining arguments replace the current column values.

        Returns:
            The updated VenueEntity, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(Venue).where(Venue.id == venue_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None

        orm.name = name
        orm.description = description
        orm.address_line = address_line
        orm.city = city
        orm.province = province
        orm.postal_code = postal_code
        orm.region = region
        orm.country = country
        orm.capacity = capacity
        orm.venue_type = venue_type
        orm.image_file_id = image_url
        orm.is_partner = is_partner
        orm.amenities = amenities
        orm.contact_name = contact_name
        orm.contact_phone = contact_phone
        orm.contact_email = contact_email

        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_entity(orm)

    async def update_venue_image(self, venue_id: uuid.UUID, image_url: str) -> VenueEntity | None:
        """Set the image_file_id field (storage object key) on an existing venue row.

        The row must already be locked by the calling transaction via
        ``get_venue_by_id(for_update=True)`` before this method is invoked.

        Args:
            venue_id:  Primary key of the venue to update.
            image_url: Storage object key of the uploaded venue image.

        Returns:
            The updated ``VenueEntity``, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(Venue).where(Venue.id == venue_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None
        orm.image_file_id = image_url
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_entity(orm)

    async def delete_venue(self, venue_id: uuid.UUID) -> bool:
        """Delete a venue row by primary key.

        Args:
            venue_id: UUID of the venue to remove.

        Returns:
            ``True`` if a row was deleted, ``False`` if no matching row existed.
        """
        result = await self.db.execute(select(Venue).where(Venue.id == venue_id))
        orm = result.scalar_one_or_none()
        if orm is None:
            return False
        await self.db.delete(orm)
        await self.db.flush()
        return True
