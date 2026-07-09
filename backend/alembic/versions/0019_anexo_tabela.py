"""Cria tabela anexo para o recurso ANEXOS por projeto

Revision ID: 0019
Revises: 0018
Create Date: 2026-07-09
"""

import sqlalchemy as sa
from alembic import op
import sqlalchemy.dialects.postgresql as pg


revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "anexo",
        sa.Column(
            "id",
            pg.UUID(as_uuid=True),
            primary_key=True,
        ),
        sa.Column("id_projeto", sa.Integer(), nullable=False),
        sa.Column("file_type", sa.String(length=100), nullable=False),
        sa.Column("file_bytes", sa.LargeBinary(), nullable=False),
        sa.Column("nome_arquivo", sa.String(length=255), nullable=False),
        sa.Column("tamanho_bytes", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("origem", sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(
            ["id_projeto"],
            ["projeto.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["usuario.id"],
            ondelete="SET NULL",
        ),
        sa.CheckConstraint(
            "origem IN ('USUARIO','SISTEMA')",
            name="ck_anexo_origem",
        ),
        sa.CheckConstraint(
            "(origem = 'SISTEMA' AND created_by IS NULL) "
            "OR (origem = 'USUARIO' AND created_by IS NOT NULL)",
            name="ck_anexo_origem_created_by",
        ),
    )

    op.create_index(
        "ix_anexo_id_projeto_origem_created_at",
        "anexo",
        ["id_projeto", "origem", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_anexo_id_projeto_origem_created_at", table_name="anexo")
    op.drop_table("anexo")
