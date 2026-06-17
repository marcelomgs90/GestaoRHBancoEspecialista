"""Remove justificativa legada da solicitacao de RH

Revision ID: 0008
Revises: 0007
Create Date: 2026-06-17
"""

from alembic import op
import sqlalchemy as sa

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("solicitacao_rh", "justificativa")


def downgrade() -> None:
    op.add_column("solicitacao_rh", sa.Column("justificativa", sa.Text(), nullable=True))
    op.execute(
        """
        UPDATE solicitacao_rh sr
        SET justificativa = sj.texto
        FROM solicitacao_justificativa sj
        WHERE sj.solicitacao_id = sr.id
          AND sj.tipo::text IN ('IMPLANTACAO', 'ALTERACAO')
        """
    )
