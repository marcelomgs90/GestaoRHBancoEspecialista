"""Torna o codigo do projeto opcional

Revision ID: 0012
Revises: 0011
Create Date: 2026-06-26
"""

from alembic import op
import sqlalchemy as sa

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "projeto",
        "codigo",
        existing_type=sa.String(length=50),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "projeto",
        "codigo",
        existing_type=sa.String(length=50),
        nullable=False,
    )
