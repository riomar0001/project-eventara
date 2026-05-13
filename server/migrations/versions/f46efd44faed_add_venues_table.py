"""add venues table

Revision ID: f46efd44faed
Revises: cddebee147ac
Create Date: 2026-04-09 17:47:23.041620

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "f46efd44faed"
down_revision: str | Sequence[str] | None = "c40e9f92494e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
