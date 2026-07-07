"""Adiciona criador do projeto

Revision ID: 0015
Revises: 0014
Create Date: 2026-07-02
"""

from alembic import op
import sqlalchemy as sa

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projeto", sa.Column("criado_por_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_projeto_criado_por_id_usuario",
        "projeto",
        "usuario",
        ["criado_por_id"],
        ["id"],
    )
    op.create_index("ix_projeto_criado_por_id", "projeto", ["criado_por_id"])


def downgrade() -> None:
    op.drop_index("ix_projeto_criado_por_id", table_name="projeto")
    op.drop_constraint("fk_projeto_criado_por_id_usuario", "projeto", type_="foreignkey")
    op.drop_column("projeto", "criado_por_id")
