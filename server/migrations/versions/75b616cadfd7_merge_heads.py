"""merge_heads

Revision ID: 75b616cadfd7
Revises: 1890e97addc8, 9912b323e7ea
Create Date: 2026-04-12 22:52:31.327800

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '75b616cadfd7'
down_revision: Union[str, Sequence[str], None] = ('1890e97addc8', '9912b323e7ea')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
