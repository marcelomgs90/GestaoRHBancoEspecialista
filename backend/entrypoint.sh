#!/bin/sh
set -e

echo "==> Aguardando banco de dados..."
sleep 3

echo "==> Executando migrações..."
# Executa a migração. Se falhar, o script para aqui mesmo 
# e o erro real fica visível nos logs do Docker!
alembic upgrade head

echo "==> Executando seed de dados iniciais..."
python scripts/seed.py

echo "==> Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 "$@"
