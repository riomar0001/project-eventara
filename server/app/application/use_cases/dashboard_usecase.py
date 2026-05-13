"""Use case for aggregating admin dashboard metrics."""

from app.application.dto.dashboard_dto import GetDashboardInput, GetDashboardOutput
from app.application.interfaces.dashboard_interface import IDashboardRepository
from app.domain.entities.dashboard_entity import DashboardMetrics
from app.domain.exceptions.dashboard_exceptions import DashboardDataFetchError


class DashboardUseCase:
    """Application service that aggregates platform-wide metrics for the admin dashboard.

    Executes nine read-only repository queries sequentially within a single database
    session.  All queries share the same implicit transaction, providing READ COMMITTED
    isolation which is appropriate for aggregate metrics: no single metric depends on
    the atomic consistency of another, so per-query snapshot semantics are sufficient.

    Concurrency strategy: because no writes occur, no locks are acquired.  The only
    race-condition risk is between two concurrent dashboard requests reading the same
    aggregates — both will obtain equivalent results and neither can corrupt state.
    Sequencing the queries (rather than parallelising them) is intentional: SQLAlchemy's
    AsyncSession wraps a single database connection and does not support concurrent
    operations on that connection.

    Args:
        repository: Concrete implementation of IDashboardRepository.
    """

    RECENT_EVENTS_LIMIT = 10
    UPCOMING_EVENTS_LIMIT = 5
    LEADERBOARD_LIMIT = 10
    TOP_VENUES_LIMIT = 3
    USERS_PER_WEEK_COUNT = 12

    def __init__(self, repository: IDashboardRepository) -> None:
        self.repository = repository

    async def get_dashboard(self, input_dto: GetDashboardInput) -> GetDashboardOutput:
        """Collect and return all dashboard metrics in a single call.

        All repository calls are wrapped in one try/except block so that any database
        failure raises DashboardDataFetchError instead of leaking raw SQL exceptions to
        the controller layer.  An already-raised DashboardDataFetchError from the
        repository is re-raised as-is to avoid masking error messages.

        Args:
            input_dto: Currently carries no parameters; reserved for future date-range
                       or filter extensions without breaking the controller contract.

        Returns:
            GetDashboardOutput containing a fully-populated DashboardMetrics aggregate.

        Raises:
            DashboardDataFetchError: Any underlying repository or database failure.
        """
        try:
            recent_events = await self.repository.get_recent_events(self.RECENT_EVENTS_LIMIT)
            ongoing_events = await self.repository.get_ongoing_events()
            upcoming_events = await self.repository.get_upcoming_events(self.UPCOMING_EVENTS_LIMIT)
            top_weekly_participants = await self.repository.get_top_weekly_participants(self.LEADERBOARD_LIMIT)
            top_weekly_volunteer_applications = await self.repository.get_top_weekly_volunteer_applications(self.LEADERBOARD_LIMIT)
            top_active_volunteers = await self.repository.get_top_active_volunteers(self.LEADERBOARD_LIMIT)
            top_active_participants = await self.repository.get_top_active_participants(self.LEADERBOARD_LIMIT)
            top_venues = await self.repository.get_top_venues(self.TOP_VENUES_LIMIT)
            users_per_week = await self.repository.get_users_per_week(self.USERS_PER_WEEK_COUNT)
        except DashboardDataFetchError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch dashboard data"
            if settings.DEBUG:
                msg = f"Failed to fetch dashboard data: {e}"
            raise DashboardDataFetchError(msg) from e

        return GetDashboardOutput(
            metrics=DashboardMetrics(
                recent_events=recent_events,
                ongoing_events=ongoing_events,
                upcoming_events=upcoming_events,
                top_weekly_participants=top_weekly_participants,
                top_weekly_volunteer_applications=top_weekly_volunteer_applications,
                top_active_volunteers=top_active_volunteers,
                top_active_participants=top_active_participants,
                top_venues=top_venues,
                users_per_week=users_per_week,
            )
        )
