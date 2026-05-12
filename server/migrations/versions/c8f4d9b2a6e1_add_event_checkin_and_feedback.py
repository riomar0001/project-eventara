"""add event check-in fields and event feedback

Revision ID: c8f4d9b2a6e1
Revises: a1b2c3d4e5f6
Create Date: 2026-05-12 18:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c8f4d9b2a6e1"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("event_participants", sa.Column("is_checked_in", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("event_participants", sa.Column("checked_in_time", sa.DateTime(timezone=True), nullable=True))
    op.add_column("event_participants", sa.Column("checked_in_by", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_event_participants_checked_in_by_users",
        "event_participants",
        "users",
        ["checked_in_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("idx_event_participants_is_checked_in", "event_participants", ["is_checked_in"], unique=False)
    op.create_index("idx_event_participants_checked_in_by", "event_participants", ["checked_in_by"], unique=False)
    op.alter_column("event_participants", "is_checked_in", server_default=None)

    op.create_table(
        "event_feedback",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("event_id", sa.UUID(), nullable=False),
        sa.Column("participant_id", sa.UUID(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("suggestion", sa.Text(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["participant_id"], ["event_participants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_event_feedback_user_id", "event_feedback", ["user_id"], unique=False)
    op.create_index("idx_event_feedback_event_id", "event_feedback", ["event_id"], unique=False)
    op.create_index("idx_event_feedback_participant_id", "event_feedback", ["participant_id"], unique=False)
    op.create_index("idx_event_feedback_rating", "event_feedback", ["event_id", "rating"], unique=False)
    op.create_index("idx_event_feedback_user_event", "event_feedback", ["user_id", "event_id"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_event_feedback_user_event", table_name="event_feedback")
    op.drop_index("idx_event_feedback_rating", table_name="event_feedback")
    op.drop_index("idx_event_feedback_participant_id", table_name="event_feedback")
    op.drop_index("idx_event_feedback_event_id", table_name="event_feedback")
    op.drop_index("idx_event_feedback_user_id", table_name="event_feedback")
    op.drop_table("event_feedback")

    op.drop_index("idx_event_participants_checked_in_by", table_name="event_participants")
    op.drop_index("idx_event_participants_is_checked_in", table_name="event_participants")
    op.drop_constraint("fk_event_participants_checked_in_by_users", "event_participants", type_="foreignkey")
    op.drop_column("event_participants", "checked_in_by")
    op.drop_column("event_participants", "checked_in_time")
    op.drop_column("event_participants", "is_checked_in")
