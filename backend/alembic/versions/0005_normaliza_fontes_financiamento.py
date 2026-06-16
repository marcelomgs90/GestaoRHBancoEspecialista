"""Normaliza fontes de financiamento do projeto

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def _enum(name: str) -> PG_ENUM:
    return PG_ENUM(name=name, create_type=False)


def upgrade() -> None:
    op.create_table(
        "projeto_fonte_financiamento",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("projeto_id", sa.Integer(), nullable=False),
        sa.Column("fonte", _enum("fontefinanciamento"), nullable=False),
        sa.Column("valor", sa.Numeric(14, 2), nullable=False),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["projeto_id"], ["projeto.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("projeto_id", "fonte", name="uq_projeto_fonte_financiamento"),
    )
    op.create_index(
        "ix_projeto_fonte_financiamento_id",
        "projeto_fonte_financiamento",
        ["id"],
    )
    op.create_index(
        "ix_projeto_fonte_financiamento_projeto_id",
        "projeto_fonte_financiamento",
        ["projeto_id"],
    )

    op.execute(
        """
        INSERT INTO projeto_fonte_financiamento (projeto_id, fonte, valor)
        SELECT
            p.id,
            item.fonte::fontefinanciamento,
            item.valor::numeric(14, 2)
        FROM projeto p
        CROSS JOIN LATERAL json_to_recordset(p.fontes_financiamento) AS item(
            fonte text,
            valor numeric
        )
        WHERE p.fontes_financiamento IS NOT NULL
          AND json_typeof(p.fontes_financiamento) = 'array'
        ON CONFLICT (projeto_id, fonte) DO NOTHING
        """
    )

    op.drop_column("projeto", "fontes_financiamento")


def downgrade() -> None:
    op.add_column(
        "projeto",
        sa.Column(
            "fontes_financiamento",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'::json"),
        ),
    )

    op.execute(
        """
        UPDATE projeto p
        SET fontes_financiamento = COALESCE(fontes.fontes, '[]'::json)
        FROM (
            SELECT
                projeto_id,
                json_agg(
                    json_build_object(
                        'fonte', fonte::text,
                        'valor', valor
                    )
                    ORDER BY fonte::text
                ) AS fontes
            FROM projeto_fonte_financiamento
            GROUP BY projeto_id
        ) fontes
        WHERE fontes.projeto_id = p.id
        """
    )
    op.execute("ALTER TABLE projeto ALTER COLUMN fontes_financiamento DROP DEFAULT")

    op.drop_index(
        "ix_projeto_fonte_financiamento_projeto_id",
        table_name="projeto_fonte_financiamento",
    )
    op.drop_index(
        "ix_projeto_fonte_financiamento_id",
        table_name="projeto_fonte_financiamento",
    )
    op.drop_table("projeto_fonte_financiamento")
