"""Protocol contract for volunteer data-access operations."""

import uuid
from typing import Protocol

from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.user_entity import User as UserEntity
from app.domain.entities.volunteer_entity import ApplicationStatus, Volunteer, VolunteerApplication, VolunteerRole


class IVolunteerRepository(Protocol):
    """Contract for volunteer, volunteer-role, and volunteer-application persistence operations."""

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

    async def get_application_by_id(
        self,
        application_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> VolunteerApplication | None: ...

    async def get_active_application_by_user_id(
        self,
        user_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> VolunteerApplication | None: ...

    async def create_application(
        self,
        user_id: uuid.UUID,
        application_data: dict | None,
    ) -> VolunteerApplication: ...

    async def update_application_status(
        self,
        application_id: uuid.UUID,
        new_status: ApplicationStatus,
    ) -> VolunteerApplication | None: ...

    async def get_all_volunteer_roles(
        self,
        search: str | None,
        is_active: bool | None,
        page: int,
        page_size: int,
    ) -> tuple[list[VolunteerRole], int]: ...

    async def update_volunteer_role(
        self,
        role_id: uuid.UUID,
        name: str | None,
        description: object,
        is_active: bool | None,
        *,
        for_update: bool = False,
    ) -> VolunteerRole | None: ...

    async def delete_volunteers_by_role_id(self, role_id: uuid.UUID) -> int: ...

    async def delete_volunteer_role_by_id(self, role_id: uuid.UUID) -> None: ...
