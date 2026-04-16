"""add user grant starts_at

Revision ID: d1c3a5fd1f52
Revises: b9f2b7a1c4d8
Create Date: 2026-04-16 00:00:01.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d1c3a5fd1f52"
down_revision: str | Sequence[str] | None = "b9f2b7a1c4d8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("user_grants", sa.Column("starts_at", sa.DateTime(), nullable=True))
    op.create_index("idx_user_grants_starts_at", "user_grants", ["starts_at"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_user_grants_starts_at", table_name="user_grants")
    op.drop_column("user_grants", "starts_at")
