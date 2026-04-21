import uuid
from dataclasses import dataclass

from app.domain.entities.authorization_entities import Feature as FeatureEntity


@dataclass
class CreateFeatureInput:
    slug: str
    name: str
    description: str | None = None
    is_enabled: bool = True


@dataclass
class UpdateFeatureInput:
    feature_id: uuid.UUID
    slug: str
    name: str
    description: str | None = None
    is_enabled: bool = True


@dataclass
class FeatureOutput:
    feature: FeatureEntity


@dataclass
class ListFeaturesOutput:
    features: list[FeatureEntity]
