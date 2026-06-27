"""Permite anexos complementares multiplos

Revision ID: 0014
Revises: 0013
Create Date: 2026-06-27
"""

from alembic import op

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("uq_projeto_anexo_tipo_documento", "projeto_anexo", type_="unique")


def downgrade() -> None:
    op.create_unique_constraint(
        "uq_projeto_anexo_tipo_documento",
        "projeto_anexo",
        ["projeto_id", "tipo_documento"],
    )
