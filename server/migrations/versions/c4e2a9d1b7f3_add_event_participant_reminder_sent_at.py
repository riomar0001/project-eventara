"""add event_participants.reminder_sent_at for session reminder emails

Revision ID: c4e2a9d1b7f3
Revises: a8d756cc0338
Create Date: 2026-11-14 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4e2a9d1b7f3"
down_revision: str | Sequence[str] | None = "a8d756cc0338"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("event_participants", sa.Column("reminder_sent_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("event_participants", "reminder_sent_at")
