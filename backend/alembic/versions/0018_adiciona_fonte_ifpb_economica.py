"""Adiciona fonte IFPB economica

Revision ID: 0018
Revises: 0017
Create Date: 2026-07-09
"""

from alembic import op


revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE fontefinanciamento ADD VALUE IF NOT EXISTS 'IFPB'")


def downgrade() -> None:
    # PostgreSQL nao remove valores de ENUM de forma segura sem recriar o tipo.
    pass
