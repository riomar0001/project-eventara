"""Protocol contract for volunteer data-access operations."""

import uuid
from typing import Protocol

from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.user_entity import User as UserEntity
from app.domain.entities.volunteer_entity import Volunteer, VolunteerRole


class IVolunteerRepository(Protocol):
    """Contract for volunteer and volunteer-role persistence operations."""

    async def get_volunteer_by_user_id(self, user_id: uuid.UUID, *, for_update: bool = False) -> Volunteer | None: ...

    async def create_volunteer(
        self,
        user_id: uuid.UUID,
        contact_phone: str,
        volunteer_role_id: uuid.UUID,
    ) -> Volunteer: ...

    async def get_volunteer_role_by_id(
        self,
        role_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> VolunteerRole | None: ...

    async def get_volunteer_role_by_name(self, name: str) -> VolunteerRole | None: ...

    async def create_volunteer_role(
        self,
        name: str,
        description: str | None,
        created_by: uuid.UUID,
    ) -> VolunteerRole: ...

    async def get_user_by_id(self, user_id: uuid.UUID) -> UserEntity | None: ...

    async def get_rbac_role_by_name(self, name: str) -> RoleEntity | None: ...
