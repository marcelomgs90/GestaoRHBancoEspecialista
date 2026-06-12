"""Adiciona fontes de financiamento ao projeto

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-11
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE projeto
        ADD COLUMN IF NOT EXISTS fontes_financiamento JSON NOT NULL DEFAULT '[]'::json
        """
    )
    op.execute("ALTER TABLE projeto ALTER COLUMN fontes_financiamento DROP DEFAULT")


def downgrade() -> None:
    op.execute("ALTER TABLE projeto DROP COLUMN IF EXISTS fontes_financiamento")
