"""add banner_url to events

Revision ID: a1b2c3d4e5f6
Revises: 7c3d86dc11de
Create Date: 2026-05-11 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '7c3d86dc11de'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('events', sa.Column('banner_url', sa.String(512), nullable=True))


def downgrade() -> None:
    op.drop_column('events', 'banner_url')
