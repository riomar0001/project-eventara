"""Application service layer for admin-side venue management.

This module exposes CRUD operations for the venue catalog. All flows enforce
business uniqueness (name + city), amenity normalisation, and cascade-safety
checks before mutations are committed.

Concurrency strategy — pessimistic SELECT … FOR UPDATE:
    Every mutating flow acquires a row-level lock on the target venue before
    performing validation or modification. Concurrent create requests that share
    the same name+city combination are serialised by ``name_exists_in_city``,
    which issues a ``SELECT … FOR UPDATE SKIP LOCKED`` so only one succeeds.
    Update and delete flows lock the row directly via ``get_venue_by_id(for_update=True)``,
    preventing another request from reading stale state between the check and
    the write. Pessimistic locking was chosen because the conflict window is
    short, collision probability is non-trivial for admin workflows, and it
    eliminates retry complexity compared to optimistic locking.

Amenity normalisation:
    All amenity strings submitted by callers are normalised to Title Case
    (e.g. ``"air conditioning"`` → ``"Air Conditioning"``) and stripped of
    surrounding whitespace before persistence. Empty strings are silently
    discarded.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.venue_dto import (
    CreateVenueInput,
    DeleteSuggestedVenueInput,
    DeleteSuggestedVenueOutput,
    ListVenuesInput,
    ListVenuesOutput,
    UpdateSuggestedVenueInput,
    UpdateSuggestedVenueOutput,
    UpdateVenueImageInput,
    UpdateVenueImageOutput,
    UpdateVenueInput,
    VenueOutput,
)
from app.domain.exceptions.venue_exceptions import (
    UnauthorizedVenueOperationError,
    VenueAlreadyExistsError,
    VenueInUseError,
    VenueNotCommunitySuggestionError,
    VenueNotFoundError,
)
from app.infrastructure.database.repositories.venue_repository import VenueRepository


def _normalise_amenities(amenities: list[str] | None) -> list[str] | None:
    """Convert raw amenity strings to deduplicated, Title-Case entries.

    Args:
        amenities: Raw list submitted by the caller, or ``None``.

    Returns:
        Cleaned list with each amenity in Title Case, or ``None`` when the
        input is ``None`` or every entry was blank.
    """
    if amenities is None:
        return None
    cleaned = list(dict.fromkeys(item.strip().title() for item in amenities if item.strip()))
    return cleaned or None


class VenueManagementUseCase:
    """Coordinates admin CRUD operations for the venue catalog."""

    def __init__(self, repo: VenueRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def list_venues(self, data: ListVenuesInput) -> ListVenuesOutput:
        """Return a paginated, filtered list of all venues.

        Args:
            data: Pagination and filter parameters.

        Returns:
            A ``ListVenuesOutput`` containing the venue slice and total count.
        """
        venues, total = await self.repo.list_venues(
            page=data.page,
            page_size=data.page_size,
            search=data.search,
            venue_type=data.venue_type,
            is_partner=data.is_partner,
        )
        return ListVenuesOutput(venues=venues, total_count=total, page=data.page, page_size=data.page_size)

    async def get_venue(self, venue_id: uuid.UUID) -> VenueOutput:
        """Return a single venue by its identifier.

        Args:
            venue_id: UUID of the target venue.

        Returns:
            A ``VenueOutput`` wrapping the matching entity.

        Raises:
            VenueNotFoundError: No venue exists for the supplied UUID.
        """
        venue = await self.repo.get_venue_by_id(venue_id)
        if venue is None:
            raise VenueNotFoundError(str(venue_id))
        return VenueOutput(venue=venue)

    async def create_venue(self, data: CreateVenueInput) -> VenueOutput:
        """Create a new venue, enforcing name uniqueness within the same city.

        Amenity strings are normalised to Title Case before persistence.

        Args:
            data: Validated creation payload including all required venue fields.

        Returns:
            A ``VenueOutput`` wrapping the newly persisted entity.

        Raises:
            VenueAlreadyExistsError: A venue with the same name already exists
                in the same city.
        """
        try:
            if await self.repo.name_exists_in_city(data.name, data.city):
                raise VenueAlreadyExistsError(data.name)

            venue = await self.repo.create_venue(
                creator_id=data.creator_id,
                name=data.name,
                description=data.description,
                address_line=data.address_line,
                city=data.city,
                province=data.province,
                postal_code=data.postal_code,
                region=data.region,
                country=data.country,
                capacity=data.capacity,
                venue_type=data.venue_type,
                image_url=data.image_url,
                is_partner=data.is_partner,
                amenities=_normalise_amenities(data.amenities),
                contact_name=data.contact_name,
                contact_phone=data.contact_phone,
                contact_email=data.contact_email,
            )
            await self.db.commit()
            return VenueOutput(venue=venue)
        except Exception:
            await self.db.rollback()
            raise

    async def update_venue(self, data: UpdateVenueInput) -> VenueOutput:
        """Update an existing venue, re-checking name uniqueness when it changes.

        Acquires a row-level lock on the venue before validating or mutating.
        Amenity strings are normalised to Title Case before persistence.

        Args:
            data: Validated update payload including the target venue_id.

        Returns:
            A ``VenueOutput`` wrapping the updated entity.

        Raises:
            VenueNotFoundError: No venue exists for the supplied UUID.
            VenueAlreadyExistsError: The new name already belongs to another
                venue in the same city.
        """
        try:
            existing = await self.repo.get_venue_by_id(data.venue_id, for_update=True)
            if existing is None:
                raise VenueNotFoundError(str(data.venue_id))

            name_changed = existing.name.lower() != data.name.lower()
            city_changed = existing.city.lower() != data.city.lower()
            if name_changed or city_changed:
                if await self.repo.name_exists_in_city(data.name, data.city, exclude_id=data.venue_id):
                    raise VenueAlreadyExistsError(data.name)

            venue = await self.repo.update_venue(
                venue_id=data.venue_id,
                name=data.name,
                description=data.description,
                address_line=data.address_line,
                city=data.city,
                province=data.province,
                postal_code=data.postal_code,
                region=data.region,
                country=data.country,
                capacity=data.capacity,
                venue_type=data.venue_type,
                image_url=data.image_url,
                is_partner=data.is_partner,
                amenities=_normalise_amenities(data.amenities),
                contact_name=data.contact_name,
                contact_phone=data.contact_phone,
                contact_email=data.contact_email,
            )
            if venue is None:
                raise VenueNotFoundError(str(data.venue_id))

            await self.db.commit()
            return VenueOutput(venue=venue)
        except Exception:
            await self.db.rollback()
            raise

    async def update_suggested_venue(self, data: UpdateSuggestedVenueInput) -> UpdateSuggestedVenueOutput:
        """Update a community-suggested venue owned by the acting user.

        The target venue row is locked with ``SELECT … FOR UPDATE`` before
        ownership, suggestion-type, and name uniqueness checks are evaluated.
        This serialises concurrent edits for the same suggestion and prevents
        a stale owner/type decision from being used for the subsequent update.

        Args:
            data: Validated update payload including target venue and actor IDs.

        Returns:
            ``UpdateSuggestedVenueOutput`` containing old and updated venue state.

        Raises:
            VenueNotFoundError: No venue exists for the supplied UUID.
            VenueNotCommunitySuggestionError: The venue is an official partner.
            UnauthorizedVenueOperationError: Caller did not create the venue.
            VenueAlreadyExistsError: The new name conflicts within the same city.
        """
        try:
            existing = await self.repo.get_venue_by_id(data.venue_id, for_update=True)
            if existing is None:
                raise VenueNotFoundError(str(data.venue_id))

            if existing.is_partner:
                raise VenueNotCommunitySuggestionError(str(data.venue_id))

            if existing.creator_id != data.updated_by:
                raise UnauthorizedVenueOperationError(str(data.venue_id))

            name_changed = existing.name.lower() != data.name.lower()
            city_changed = existing.city.lower() != data.city.lower()
            if name_changed or city_changed:
                if await self.repo.name_exists_in_city(data.name, data.city, exclude_id=data.venue_id):
                    raise VenueAlreadyExistsError(data.name)

            venue = await self.repo.update_venue(
                venue_id=data.venue_id,
                name=data.name,
                description=data.description,
                address_line=data.address_line,
                city=data.city,
                province=data.province,
                postal_code=data.postal_code,
                region=data.region,
                country=data.country,
                capacity=data.capacity,
                venue_type=data.venue_type,
                image_url=data.image_url,
                is_partner=False,
                amenities=_normalise_amenities(data.amenities),
                contact_name=data.contact_name,
                contact_phone=data.contact_phone,
                contact_email=data.contact_email,
            )
            if venue is None:
                raise VenueNotFoundError(str(data.venue_id))

            await self.db.commit()
            return UpdateSuggestedVenueOutput(venue=venue, old_venue=existing)
        except Exception:
            await self.db.rollback()
            raise

    async def delete_suggested_venue(self, data: DeleteSuggestedVenueInput) -> DeleteSuggestedVenueOutput:
        """Delete an unused community-suggested venue owned by the acting user.

        The venue is locked before validating ownership and event-session usage.
        The dependent-session check and delete run in the same transaction so a
        concurrent request cannot observe stale state between validation and
        deletion.

        Args:
            data: Target venue ID and acting user ID.

        Returns:
            ``DeleteSuggestedVenueOutput`` containing the deleted venue state.

        Raises:
            VenueNotFoundError: No venue exists for the supplied UUID.
            VenueNotCommunitySuggestionError: The venue is an official partner.
            UnauthorizedVenueOperationError: Caller did not create the venue.
            VenueInUseError: Event sessions still reference the venue.
        """
        try:
            venue = await self.repo.get_venue_by_id(data.venue_id, for_update=True)
            if venue is None:
                raise VenueNotFoundError(str(data.venue_id))

            if venue.is_partner:
                raise VenueNotCommunitySuggestionError(str(data.venue_id))

            if venue.creator_id != data.deleted_by:
                raise UnauthorizedVenueOperationError(str(data.venue_id))

            session_count = await self.repo.get_event_session_count(data.venue_id)
            if session_count > 0:
                raise VenueInUseError(str(data.venue_id))

            deleted = await self.repo.delete_venue(data.venue_id)
            if not deleted:
                raise VenueNotFoundError(str(data.venue_id))

            await self.db.commit()
            return DeleteSuggestedVenueOutput(venue=venue)
        except Exception:
            await self.db.rollback()
            raise

    async def update_venue_image(self, data: UpdateVenueImageInput) -> UpdateVenueImageOutput:
        """Replace the cover image object key for an existing venue.

        Acquires a pessimistic row-level lock on the venue before the
        ownership check and the URL write, serialising concurrent image-update
        requests for the same venue and eliminating the TOCTOU window between
        the authorisation check and the UPDATE.

        The presigned upload URL is generated by the route layer before this
        method is invoked, keeping the storage service call outside the
        database transaction.

        Args:
            data: ``UpdateVenueImageInput`` with venue_id, acting user_id,
                  and the object key to store as the venue image.

        Returns:
            ``UpdateVenueImageOutput`` with the updated venue entity and the
            previous image object key (for audit log construction).

        Raises:
            VenueNotFoundError: No venue exists for ``data.venue_id``.
            UnauthorizedVenueOperationError: Caller is not the venue creator.
        """
        try:
            venue = await self.repo.get_venue_by_id(data.venue_id, for_update=True)
            if venue is None:
                raise VenueNotFoundError(str(data.venue_id))

            if venue.creator_id != data.updated_by:
                raise UnauthorizedVenueOperationError(str(data.venue_id))

            old_image_url = venue.image_url

            updated_venue = await self.repo.update_venue_image(data.venue_id, data.image_url)
            if updated_venue is None:
                raise VenueNotFoundError(str(data.venue_id))

            await self.db.commit()
            return UpdateVenueImageOutput(venue=updated_venue, old_image_url=old_image_url)
        except Exception:
            await self.db.rollback()
            raise

    async def delete_venue(self, venue_id: uuid.UUID) -> None:
        """Delete a venue when no event sessions still reference it.

        Acquires a row-level lock before checking for dependents to serialise
        concurrent delete attempts.

        Args:
            venue_id: UUID of the venue to remove.

        Raises:
            VenueNotFoundError: No venue exists for the supplied UUID.
            VenueInUseError: At least one event session references this venue.
        """
        try:
            venue = await self.repo.get_venue_by_id(venue_id, for_update=True)
            if venue is None:
                raise VenueNotFoundError(str(venue_id))

            session_count = await self.repo.get_event_session_count(venue_id)
            if session_count > 0:
                raise VenueInUseError(str(venue_id))

            deleted = await self.repo.delete_venue(venue_id)
            if not deleted:
                raise VenueNotFoundError(str(venue_id))

            await self.db.commit()
        except Exception:
            await self.db.rollback()
            raise
