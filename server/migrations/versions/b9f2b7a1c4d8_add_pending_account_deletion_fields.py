"""add pending account deletion fields

Revision ID: b9f2b7a1c4d8
Revises: ff122a55598e
Create Date: 2026-04-16 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b9f2b7a1c4d8"
down_revision: str | Sequence[str] | None = "ff122a55598e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("deletion_requested_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("deletion_scheduled_for", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("deletion_requested_by", sa.UUID(), nullable=True))
    op.add_column("users", sa.Column("deletion_reason", sa.Text(), nullable=True))
    op.create_foreign_key(
        "fk_users_deletion_requested_by_users",
        "users",
        "users",
        ["deletion_requested_by"],
        ["id"],
    )
    op.create_index("idx_users_deletion_scheduled_for", "users", ["deletion_scheduled_for"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_users_deletion_scheduled_for", table_name="users")
    op.drop_constraint("fk_users_deletion_requested_by_users", "users", type_="foreignkey")
    op.drop_column("users", "deletion_reason")
    op.drop_column("users", "deletion_requested_by")
    op.drop_column("users", "deletion_scheduled_for")
    op.drop_column("users", "deletion_requested_at")
