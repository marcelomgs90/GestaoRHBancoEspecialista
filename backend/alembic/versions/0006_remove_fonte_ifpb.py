"""Remove fonte pagadora IFPB

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-16
"""

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DELETE FROM projeto_fonte_financiamento WHERE fonte::text = 'IFPB'")
    op.execute("DELETE FROM pesquisador_projeto WHERE fonte_financiamento::text = 'IFPB'")

    op.execute("ALTER TYPE fontefinanciamento RENAME TO fontefinanciamento_old")
    op.execute("CREATE TYPE fontefinanciamento AS ENUM ('EMBRAPII', 'EMPRESA', 'SEBRAE')")
    op.execute(
        """
        ALTER TABLE projeto_fonte_financiamento
        ALTER COLUMN fonte TYPE fontefinanciamento
        USING fonte::text::fontefinanciamento
        """
    )
    op.execute(
        """
        ALTER TABLE pesquisador_projeto
        ALTER COLUMN fonte_financiamento TYPE fontefinanciamento
        USING fonte_financiamento::text::fontefinanciamento
        """
    )
    op.execute("DROP TYPE fontefinanciamento_old")


def downgrade() -> None:
    op.execute("ALTER TYPE fontefinanciamento ADD VALUE IF NOT EXISTS 'IFPB'")
