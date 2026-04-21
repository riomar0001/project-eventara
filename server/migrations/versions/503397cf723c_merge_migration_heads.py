"""merge migration heads

Revision ID: 503397cf723c
Revises: 3e41f7c2a125, d1c3a5fd1f52
Create Date: 2026-04-21 10:42:53.069326

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '503397cf723c'
down_revision: Union[str, Sequence[str], None] = ('3e41f7c2a125', 'd1c3a5fd1f52')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
