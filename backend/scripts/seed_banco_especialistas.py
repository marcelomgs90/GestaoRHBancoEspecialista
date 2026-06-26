"""
Seed para o Banco de Especialistas (schema externo).

Popula `public.users_specialist_types` (tipos de especialista) e
`public.users` (pesquisadores ficticios) com FK `specialist_type_id`
apontando para os tipos acima. Usado em dev/staging para que o endpoint
`/especialistas/pesquisadores/` tenha dados via INNER JOIN.

Pressupostos:
  - Variavel BANCO_ESPECIALISTAS_URL configurada apontando para um banco
    PostgreSQL externo com schema `public`.
  - Alembic NAO gerencia este schema — este script roda SQL direto.

Execucao:
    cd backend
    python scripts/seed_banco_especialistas.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text

from app.core.database import EspecialistasSessionLocal
from app.core.config import get_settings


TIPOS_ESPECIALISTA = [
    "Servidor",
    "Estudante",
    "Colaborador Externo",
]

# (cpf, full_name, tipo) — `tipo` casa via ILIKE com users_specialist_types.name
PESQUISADORES = [
    ("111.111.111-11", "Ana Coordenadora",   "Servidor"),
    ("444.444.444-44", "Daniel Servidor",    "Servidor"),
    ("555.555.555-55", "Elisa Pesquisadora", "Servidor"),
    ("666.666.666-66", "Felipe Tecnico",     "Servidor"),
    ("777.777.777-77", "Gabriela Estudante", "Estudante"),
]


def _ensure_users_table(db):
    """Cria public.users (sem coluna tipo_vinculo) se nao existir."""
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS public.users (
            id SERIAL PRIMARY KEY,
            cpf VARCHAR(14) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            specialist_type_id INTEGER
        );
    """))
    db.execute(text("CREATE INDEX IF NOT EXISTS ix_users_cpf ON public.users (cpf);"))
    db.commit()


def _ensure_specialist_types_table(db):
    """Cria public.users_specialist_types e popula os tipos basicos."""
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS public.users_specialist_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL
        );
    """))
    for tipo in TIPOS_ESPECIALISTA:
        db.execute(
            text(
                """
                INSERT INTO public.users_specialist_types (name)
                VALUES (:name)
                ON CONFLICT (name) DO NOTHING
                """
            ),
            {"name": tipo},
        )
    db.commit()


def _add_specialist_type_fk_if_missing(db):
    """Adiciona FK users.specialist_type_id -> users_specialist_types.id
    caso ainda nao exista. Idempotente.
    """
    db.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_users_specialist_type'
                  AND table_name = 'users'
                  AND table_schema = 'public'
            ) THEN
                ALTER TABLE public.users
                ADD CONSTRAINT fk_users_specialist_type
                FOREIGN KEY (specialist_type_id)
                REFERENCES public.users_specialist_types(id);
            END IF;
        END $$;
    """))
    db.commit()


def _upsert_pesquisadores(db):
    for cpf, full_name, tipo in PESQUISADORES:
        type_row = db.execute(
            text("SELECT id FROM public.users_specialist_types WHERE name = :name"),
            {"name": tipo},
        ).first()
        if not type_row:
            print(f"[!!] Tipo '{tipo}' nao encontrado; pulando {cpf}.")
            continue
        specialist_type_id = type_row[0]

        existente = db.execute(
            text("SELECT id FROM public.users WHERE cpf = :cpf"),
            {"cpf": cpf},
        ).first()
        if existente:
            continue

        db.execute(
            text(
                """
                INSERT INTO public.users (cpf, full_name, specialist_type_id)
                VALUES (:cpf, :full_name, :specialist_type_id)
                """
            ),
            {
                "cpf": cpf,
                "full_name": full_name,
                "specialist_type_id": specialist_type_id,
            },
        )
    db.commit()


def run_seed():
    settings = get_settings()
    if not settings.BANCO_ESPECIALISTAS_URL:
        print("[--] BANCO_ESPECIALISTAS_URL nao configurada — pulando.")
        return

    if EspecialistasSessionLocal is None:
        print("[--] EspecialistasSessionLocal indisponivel — pulando.")
        return

    db = EspecialistasSessionLocal()
    try:
        _ensure_users_table(db)
        _ensure_specialist_types_table(db)
        _add_specialist_type_fk_if_missing(db)
        _upsert_pesquisadores(db)
        print(f"[OK] {len(PESQUISADORES)} pesquisadores (re)verificados no Banco Especialista.")
    except Exception as e:
        db.rollback()
        print(f"\n[ERRO] Seed do Banco Especialista falhou: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Executando seed do Banco Especialista...")
    run_seed()