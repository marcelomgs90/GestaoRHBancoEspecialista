"""Renomeia texto da justificativa para descricao

Revision ID: 0009
Revises: 0008
Create Date: 2026-06-17
"""

from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "solicitacao_justificativa",
        "texto",
        new_column_name="descricao",
    )


def downgrade() -> None:
    op.alter_column(
        "solicitacao_justificativa",
        "descricao",
        new_column_name="texto",
    )
