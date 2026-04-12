"""add accepted_terms and accepted_privacy_policy to users

Revision ID: 9912b323e7ea
Revises: f46efd44faed
Create Date: 2026-04-12 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "9912b323e7ea"
down_revision: str | None = "f46efd44faed"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("accepted_terms", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("accepted_terms_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("accepted_privacy_policy", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("accepted_privacy_policy_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "accepted_privacy_policy_at")
    op.drop_column("users", "accepted_privacy_policy")
    op.drop_column("users", "accepted_terms_at")
    op.drop_column("users", "accepted_terms")
