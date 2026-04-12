"""added venues table

Revision ID: 47b927a40ba1
Revises: 35383d0a5631
Create Date: 2026-04-12 12:51:52.438997

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "47b927a40ba1"
down_revision: str | Sequence[str] | None = "35383d0a5631"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "venues",
        sa.Column("creator_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("address_line", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("province", sa.String(length=100), nullable=False),
        sa.Column("postal_code", sa.String(length=20), nullable=False),
        sa.Column("country", sa.String(length=100), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("venue_type", sa.Enum("INDOOR", "OUTDOOR", "HYBRID", name="venuetype", native_enum=False), nullable=False),
        sa.Column("contact_name", sa.String(length=255), nullable=False),
        sa.Column("contact_phone", sa.String(length=20), nullable=False),
        sa.Column("contact_email", sa.String(length=255), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_venues_city", "venues", ["city"], unique=False)
    op.create_index("idx_venues_name", "venues", ["name"], unique=False)
    op.create_index("idx_venues_name_city", "venues", ["name", "city"], unique=False)
    op.create_index("idx_venues_venue_type", "venues", ["venue_type"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_venues_venue_type", table_name="venues")
    op.drop_index("idx_venues_name_city", table_name="venues")
    op.drop_index("idx_venues_name", table_name="venues")
    op.drop_index("idx_venues_city", table_name="venues")
    op.drop_table("venues")
