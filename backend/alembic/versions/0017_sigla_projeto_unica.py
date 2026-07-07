"""Garante sigla unica de projeto

Revision ID: 0017
Revises: 0016
Create Date: 2026-07-07
"""

from alembic import op


revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_projeto_sigla", "projeto", ["sigla"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_projeto_sigla", table_name="projeto")
