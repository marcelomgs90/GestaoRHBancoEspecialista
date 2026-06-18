"""Adiciona metadados aos anexos de projeto

Revision ID: 0010
Revises: 0009
Create Date: 2026-06-17
"""

from alembic import op
import sqlalchemy as sa

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projeto_anexo", sa.Column("content_type", sa.String(length=100), nullable=True))
    op.add_column("projeto_anexo", sa.Column("tamanho_bytes", sa.Integer(), nullable=True))
    op.create_unique_constraint(
        "uq_projeto_anexo_tipo_documento",
        "projeto_anexo",
        ["projeto_id", "tipo_documento"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_projeto_anexo_tipo_documento", "projeto_anexo", type_="unique")
    op.drop_column("projeto_anexo", "tamanho_bytes")
    op.drop_column("projeto_anexo", "content_type")
