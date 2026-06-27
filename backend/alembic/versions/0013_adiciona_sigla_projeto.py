"""Adiciona sigla obrigatoria ao projeto

Revision ID: 0013
Revises: 0012
Create Date: 2026-06-26
"""

from alembic import op
import sqlalchemy as sa

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projeto", sa.Column("sigla", sa.String(length=20), nullable=True))
    op.execute("UPDATE projeto SET sigla = 'PROJ' || id::text WHERE sigla IS NULL")
    op.alter_column(
        "projeto",
        "sigla",
        existing_type=sa.String(length=20),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column("projeto", "sigla")
