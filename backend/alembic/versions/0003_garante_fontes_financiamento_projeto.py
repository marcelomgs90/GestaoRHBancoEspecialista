"""Garante coluna de fontes de financiamento no projeto

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-11
"""

from alembic import op

revision = "0003"
down_revision = "0002"
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
