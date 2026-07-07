"""Adiciona fluxo de primeiro acesso do usuario

Revision ID: 0016
Revises: 0015
Create Date: 2026-07-02
"""

from alembic import op
import sqlalchemy as sa

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "usuario",
        sa.Column("senha_definida", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column("usuario", sa.Column("convite_token_hash", sa.String(length=255), nullable=True))
    op.add_column("usuario", sa.Column("convite_expira_em", sa.DateTime(), nullable=True))
    op.alter_column("usuario", "senha_definida", server_default=None)


def downgrade() -> None:
    op.drop_column("usuario", "convite_expira_em")
    op.drop_column("usuario", "convite_token_hash")
    op.drop_column("usuario", "senha_definida")
