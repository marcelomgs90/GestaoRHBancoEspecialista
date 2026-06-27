"""Normaliza usuario.ref_usuario para o CPF do pesquisador no Banco Especialista.

Esta migration e idempotente. Registros que ja possuem `ref_usuario` no formato
de CPF (11 digitos, com ou sem pontuacao) nao sao alterados. Registros com
valores livres (ex.: 'COORD-001') permanecem como estao e sao logados via
SQLAlchemy para revisao manual. O bridge Pesquisador<->Usuario exige que
`usuario.ref_usuario` corresponda ao CPF do registro em `public.users.cpf`
no Banco Especialista.

Revision ID: 0011
Revises: 0010
Create Date: 2026-06-26
"""
import logging
import re

from alembic import op
import sqlalchemy as sa


revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


logger = logging.getLogger("alembic.env")

CPF_PATTERN = re.compile(r"^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$")


def upgrade() -> None:
    conn = op.get_bind()

    total = conn.execute(sa.text("SELECT count(*) FROM usuario")).scalar_one()
    orfaos = conn.execute(
        sa.text(
            """
            SELECT id, ref_usuario, email
            FROM usuario
            WHERE ref_usuario IS NOT NULL
              AND ref_usuario !~ '^[0-9]{3}\\.?[0-9]{3}\\.?[0-9]{3}-?[0-9]{2}$'
            """
        )
    ).fetchall()

    if orfaos:
        for row in orfaos:
            logger.warning(
                "usuario.ref_usuario nao normalizado para id=%s email=%s valor=%r",
                row.id,
                row.email,
                row.ref_usuario,
            )
        logger.warning(
            "Total de registros orfaos em usuario.ref_usuario: %d/%d",
            len(orfaos),
            total,
        )


def downgrade() -> None:
    # Nao ha coluna nova para reverter — a normalizacao e apenas logica.
    pass