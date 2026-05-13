from dataclasses import dataclass

from app.domain.entities.dashboard_entity import DashboardMetrics


@dataclass
class GetDashboardInput:
    pass


@dataclass
class GetDashboardOutput:
    metrics: DashboardMetrics
