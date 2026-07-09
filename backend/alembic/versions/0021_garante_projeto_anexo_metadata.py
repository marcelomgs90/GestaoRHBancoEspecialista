"""Garante que projeto_anexo possui as colunas content_type e tamanho_bytes.

Em algum momento do desenvolvimento, o `alembic_version` foi avancado
diretamente para 0019 sem que as migrations 0010-0018 tivessem sido
efetivamente aplicadas. Isso deixou a tabela `projeto_anexo` no DB com
schema antigo, faltando as colunas que o ORM espera.

Esta migration eh idempotente (usa `ADD COLUMN IF NOT EXISTS`) e reestabelece
o schema esperado.

Revision ID: 0021
Revises: 0019
Create Date: 2026-07-09
"""

from alembic import op


revision = "0021"
down_revision = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # IF NOT EXISTS (Postgres 9.6+) torna a migration segura para re-execucao
    # em bancos onde as colunas ja tenham sido adicionadas manualmente.
    op.execute("ALTER TABLE projeto_anexo ADD COLUMN IF NOT EXISTS content_type VARCHAR(100)")
    op.execute("ALTER TABLE projeto_anexo ADD COLUMN IF NOT EXISTS tamanho_bytes INTEGER")
    # A migration 0014 removeu a constraint unique (projeto_id, tipo_documento).
    # Se um banco foi inicializado via Base.metadata.create_all (seed.py)
    # apos a 0014, a constraint nunca chegou a existir. Garantimos aqui que
    # ela NAO existe mais, mantendo a consistencia com a versao atual do
    # `ProjetoAnexo` (que permite multiplos anexos do mesmo tipo).
    op.execute("ALTER TABLE projeto_anexo DROP CONSTRAINT IF EXISTS uq_projeto_anexo_tipo_documento")


def downgrade() -> None:
    op.execute("ALTER TABLE projeto_anexo DROP CONSTRAINT IF EXISTS uq_projeto_anexo_tipo_documento")
    op.drop_column("projeto_anexo", "tamanho_bytes")
    op.drop_column("projeto_anexo", "content_type")
