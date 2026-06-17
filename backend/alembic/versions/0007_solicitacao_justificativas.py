"""Cria justificativas por evento da solicitacao

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


tipo_justificativa = postgresql.ENUM(
    "IMPLANTACAO",
    "ALTERACAO",
    "REJEICAO",
    name="tipojustificativasolicitacao",
    create_type=False,
)


def upgrade() -> None:
    tipo_justificativa.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "solicitacao_justificativa",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("solicitacao_id", sa.Integer(), nullable=False),
        sa.Column("tipo", tipo_justificativa, nullable=False),
        sa.Column("texto", sa.Text(), nullable=False),
        sa.Column("criado_por", sa.Integer(), nullable=False),
        sa.Column("criado_em", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["criado_por"], ["usuario.id"]),
        sa.ForeignKeyConstraint(["solicitacao_id"], ["solicitacao_rh.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "solicitacao_id",
            "tipo",
            name="uq_solicitacao_justificativa_tipo",
        ),
    )
    op.create_index(
        op.f("ix_solicitacao_justificativa_id"),
        "solicitacao_justificativa",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_solicitacao_justificativa_solicitacao_id"),
        "solicitacao_justificativa",
        ["solicitacao_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_solicitacao_justificativa_tipo"),
        "solicitacao_justificativa",
        ["tipo"],
        unique=False,
    )

    op.execute(
        """
        INSERT INTO solicitacao_justificativa
            (solicitacao_id, tipo, texto, criado_por, criado_em, atualizado_em)
        SELECT
            id,
            tipo::text::tipojustificativasolicitacao,
            justificativa,
            criado_por,
            criado_em,
            atualizado_em
        FROM solicitacao_rh
        WHERE justificativa IS NOT NULL
          AND btrim(justificativa) <> ''
          AND tipo::text IN ('IMPLANTACAO', 'ALTERACAO')
        """
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_solicitacao_justificativa_tipo"),
        table_name="solicitacao_justificativa",
    )
    op.drop_index(
        op.f("ix_solicitacao_justificativa_solicitacao_id"),
        table_name="solicitacao_justificativa",
    )
    op.drop_index(
        op.f("ix_solicitacao_justificativa_id"),
        table_name="solicitacao_justificativa",
    )
    op.drop_table("solicitacao_justificativa")
    tipo_justificativa.drop(op.get_bind(), checkfirst=True)
