"""merge migration branches

Revision ID: 35383d0a5631
Revises: c40e9f92494e, f46efd44faed
Create Date: 2026-04-12 12:51:38.222470

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35383d0a5631'
down_revision: Union[str, Sequence[str], None] = ('c40e9f92494e', 'f46efd44faed')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
