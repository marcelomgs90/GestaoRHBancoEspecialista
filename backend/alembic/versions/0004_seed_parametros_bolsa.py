"""Seed de parâmetros de bolsa para todas as categorias

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-11

"""
from typing import Sequence, Union
from datetime import date
from decimal import Decimal

from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '0004'
down_revision: Union[str, None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Valores de bolsa baseados na Resolução 11/2022
VALORES_BOLSA = [
    ('PESQUISADOR_MASTER', 'Pesquisador Master', 6000.00, 20),
    ('PESQUISADOR_SENIOR', 'Pesquisador Senior', 5000.00, 20),
    ('PESQUISADOR_PLENO', 'Pesquisador Pleno', 4000.00, 20),
    ('PESQUISADOR_JUNIOR', 'Pesquisador Júnior', 2000.00, 20),
    ('PROFISSIONAL_SENIOR', 'Profissional Senior', 4500.00, 20),
    ('PROFISSIONAL_PLENO', 'Profissional Pleno', 3500.00, 20),
    ('PROFISSIONAL_JUNIOR', 'Profissional Júnior', 2500.00, 40),
    ('PROFISSIONAL_INICIANTE', 'Profissional Iniciante', 1500.00, 40),
    ('ESTUDANTE_SUPERIOR_AVANCADO', 'Estudante Superior Avançado', 1500.00, 20),
    ('ESTUDANTE_SUPERIOR_INTERMEDIARIO', 'Estudante Superior Intermediário', 1200.00, 20),
    ('ESTUDANTE_SUPERIOR_INICIANTE', 'Estudante Superior Iniciante', 800.00, 20),
    ('ESTUDANTE_MEDIO', 'Estudante de Nível Médio', 600.00, 20),
]


def upgrade() -> None:
    conn = op.get_bind()
    vigencia_inicio = date(2022, 1, 1)

    # Verifica e insere limite de carga horária se não existir
    result = conn.execute(text(
        "SELECT COUNT(*) FROM parametro_regra WHERE tipo_regra = 'LIMITE_CARGA_HORARIA'"
    ))
    if result.scalar() == 0:
        conn.execute(text("""
            INSERT INTO parametro_regra (tipo_regra, descricao, limite_carga_horaria_semanal, vigencia_inicio, ativo)
            VALUES ('LIMITE_CARGA_HORARIA', 'Limite semanal global de carga horária por pesquisador (Res. 11/2022)', 20, :vigencia, true)
        """), {"vigencia": vigencia_inicio})

    # Insere parâmetros de bolsa faltantes
    for categoria, descricao, valor, ch_ref in VALORES_BOLSA:
        result = conn.execute(text(
            "SELECT COUNT(*) FROM parametro_regra WHERE tipo_regra = 'VALOR_BOLSA' AND categoria_bolsa = :categoria"
        ), {"categoria": categoria})

        if result.scalar() == 0:
            conn.execute(text("""
                INSERT INTO parametro_regra (tipo_regra, categoria_bolsa, descricao, valor_bolsa_referencia, carga_horaria_referencia, vigencia_inicio, ativo)
                VALUES ('VALOR_BOLSA', :categoria, :descricao, :valor, :ch_ref, :vigencia, true)
            """), {
                "categoria": categoria,
                "descricao": descricao,
                "valor": valor,
                "ch_ref": ch_ref,
                "vigencia": vigencia_inicio
            })


def downgrade() -> None:
    # Não remove os parâmetros no downgrade para não perder dados
    pass
