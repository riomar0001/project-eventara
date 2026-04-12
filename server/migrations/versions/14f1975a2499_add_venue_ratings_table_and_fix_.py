"""add venue_ratings table and fix relationship issues

Revision ID: 14f1975a2499
Revises: 47b927a40ba1
Create Date: 2026-04-12 15:42:17.544164

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "14f1975a2499"
down_revision: str | Sequence[str] | None = "47b927a40ba1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "venue_ratings",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user_profiles.user_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_venue_ratings_user_id", "venue_ratings", ["user_id"], unique=False)
    op.create_index("idx_venue_ratings_venue_id", "venue_ratings", ["venue_id"], unique=False)
    op.create_index("idx_venue_ratings_user_venue", "venue_ratings", ["user_id", "venue_id"], unique=True)


def downgrade() -> None:
    op.drop_index("idx_venue_ratings_user_venue", table_name="venue_ratings")
    op.drop_index("idx_venue_ratings_venue_id", table_name="venue_ratings")
    op.drop_index("idx_venue_ratings_user_id", table_name="venue_ratings")
    op.drop_table("venue_ratings")
