"""Use cases for venue rating submission, updates, and retrieval.

Each authenticated user may submit exactly one rating per venue (enforced by
the ``(user_id, venue_id)`` unique index).  Ratings may be updated or retracted
at any time by the submitting user.  All write operations update the venue's
``popularity_count`` counter within the same transaction so the aggregate stays
consistent.

Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE):
    Before any create, update, or delete the use case acquires a row-level lock
    on the target rating row (or the vacancy where it would sit) via
    ``get_by_user_and_venue(for_update=True)``.  This serialises concurrent
    requests from the same user on the same venue, eliminating the TOCTOU window
    between the existence check and the mutation.  The database unique composite
    index on ``(user_id, venue_id)`` remains the final integrity guard for
    cross-session races on create; ``IntegrityError`` is caught and remapped to
    ``VenueRatingAlreadyExistsError``.
"""

import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.venue_rating_dto import (
    CreateVenueRatingInput,
    ListVenueRatingsInput,
    ListVenueRatingsOutput,
    UpdateVenueRatingInput,
    VenueAverageRatingOutput,
    VenueRatingOutput,
)
from app.domain.exceptions.venue_exceptions import VenueNotFoundError
from app.domain.exceptions.venue_rating_exceptions import (
    VenueRatingAlreadyExistsError,
    VenueRatingNotFoundError,
)
from app.infrastructure.database.repositories.venue_rating_repository import VenueRatingRepository


class VenueRatingUseCase:
    """Application service for all venue rating operations.

    Owns the transaction lifecycle: commits on success, rolls back on any
    domain or infrastructure failure before propagating the exception.

    Args:
        repo: Concrete ``VenueRatingRepository`` providing data-access methods.
        db:   The active async database session used for commit and rollback.
    """

    def __init__(self, repo: VenueRatingRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def create_rating(self, data: CreateVenueRatingInput) -> VenueRatingOutput:
        """Submit a new rating for a venue.

        Guards are applied in order: venue existence, duplicate check (with
        ``FOR UPDATE`` lock), insert, popularity increment, commit.

        Args:
            data: ``CreateVenueRatingInput`` with the user ID, venue ID, integer
                rating (1–5), and an optional comment.

        Returns:
            ``VenueRatingOutput`` wrapping the newly created rating.

        Raises:
            VenueNotFoundError: No venue exists for the given ID.
            VenueRatingAlreadyExistsError: The user has already rated this venue,
                or a concurrent create collided on the unique constraint.
        """
        if not await self.repo.venue_exists(data.venue_id):
            raise VenueNotFoundError()

        existing = await self.repo.get_by_user_and_venue(data.user_id, data.venue_id, for_update=True)
        if existing:
            raise VenueRatingAlreadyExistsError(str(data.user_id), str(data.venue_id))

        try:
            rating = await self.repo.create(data.user_id, data.venue_id, data.rating, data.comment)
            await self.repo.increment_venue_popularity(data.venue_id)
        except IntegrityError:
            await self.db.rollback()
            raise VenueRatingAlreadyExistsError(str(data.user_id), str(data.venue_id))
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return VenueRatingOutput(rating=rating)

    async def get_my_rating(self, user_id: uuid.UUID, venue_id: uuid.UUID) -> VenueRatingOutput:
        """Return the authenticated user's rating for a specific venue.

        Args:
            user_id:  UUID of the requesting user.
            venue_id: UUID of the target venue.

        Returns:
            ``VenueRatingOutput`` wrapping the matching rating.

        Raises:
            VenueNotFoundError: No venue exists for the given ID.
            VenueRatingNotFoundError: The user has not rated this venue.
        """
        if not await self.repo.venue_exists(venue_id):
            raise VenueNotFoundError()

        rating = await self.repo.get_by_user_and_venue(user_id, venue_id)
        if not rating:
            raise VenueRatingNotFoundError()
        return VenueRatingOutput(rating=rating)

    async def update_rating(self, data: UpdateVenueRatingInput) -> VenueRatingOutput:
        """Replace the rating value and/or comment for an existing submission.

        The ``FOR UPDATE`` lock acquired on the current rating serialises
        concurrent update and delete requests targeting the same row.

        Args:
            data: ``UpdateVenueRatingInput`` with the user ID, venue ID, new
                integer rating, and optional comment.

        Returns:
            ``VenueRatingOutput`` wrapping the updated rating.

        Raises:
            VenueNotFoundError: No venue exists for the given ID.
            VenueRatingNotFoundError: The user has not rated this venue.
        """
        if not await self.repo.venue_exists(data.venue_id):
            raise VenueNotFoundError()

        existing = await self.repo.get_by_user_and_venue(data.user_id, data.venue_id, for_update=True)
        if not existing:
            raise VenueRatingNotFoundError()

        try:
            updated = await self.repo.update(
                data.user_id,
                data.venue_id,
                rating=data.rating,
                comment=data.comment,
            )
        except Exception:
            await self.db.rollback()
            raise

        if updated is None:
            await self.db.rollback()
            raise VenueRatingNotFoundError()

        await self.db.commit()
        return VenueRatingOutput(rating=updated)

    async def delete_rating(self, user_id: uuid.UUID, venue_id: uuid.UUID) -> None:
        """Remove the authenticated user's rating from a venue.

        Decrements ``venue.popularity_count`` atomically within the same
        transaction as the delete so the counter never drifts.

        Args:
            user_id:  UUID of the requesting user.
            venue_id: UUID of the target venue.

        Raises:
            VenueNotFoundError: No venue exists for the given ID.
            VenueRatingNotFoundError: The user has not rated this venue.
        """
        if not await self.repo.venue_exists(venue_id):
            raise VenueNotFoundError()

        existing = await self.repo.get_by_user_and_venue(user_id, venue_id, for_update=True)
        if not existing:
            raise VenueRatingNotFoundError()

        try:
            deleted = await self.repo.delete(user_id, venue_id)
            if not deleted:
                await self.db.rollback()
                raise VenueRatingNotFoundError()
            await self.repo.decrement_venue_popularity(venue_id)
        except VenueRatingNotFoundError:
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()

    async def get_average_rating(self, venue_id: uuid.UUID) -> VenueAverageRatingOutput:
        """Return the mean rating value and submission count for a venue.

        Args:
            venue_id: UUID of the target venue.

        Returns:
            ``VenueAverageRatingOutput`` with ``average`` (``None`` when no ratings
            exist) and ``count``.

        Raises:
            VenueNotFoundError: No venue exists for the given ID.
        """
        if not await self.repo.venue_exists(venue_id):
            raise VenueNotFoundError()

        average, count = await self.repo.get_average_rating(venue_id)
        return VenueAverageRatingOutput(venue_id=venue_id, average=average, count=count)

    async def list_ratings(self, data: ListVenueRatingsInput) -> ListVenueRatingsOutput:
        """Return a paginated list of ratings for a venue.

        Args:
            data: ``ListVenueRatingsInput`` with the venue ID and pagination params.

        Returns:
            ``ListVenueRatingsOutput`` with the rating slice and total count.

        Raises:
            VenueNotFoundError: No venue exists for the given ID.
        """
        if not await self.repo.venue_exists(data.venue_id):
            raise VenueNotFoundError()

        ratings, total = await self.repo.list_by_venue(
            data.venue_id, page=data.page, page_size=data.page_size
        )
        return ListVenueRatingsOutput(
            ratings=ratings,
            total_count=total,
            page=data.page,
            page_size=data.page_size,
        )
