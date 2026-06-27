#!/bin/sh
set -e

echo "==> Aguardando banco de dados..."
sleep 3

echo "==> Executando migrações..."
# Auto-recuperacao: se o upgrade falhar porque o schema ja existe
# (bootstrap via create_all/seed manual) mas a tabela alembic_version
# esta vazia, fazemos stamp e re-tentamos. Isso torna o container
# idempotente em relacao ao estado do banco.
if ! alembic upgrade head; then
  echo "==> Upgrade falhou — assumindo schema pre-existente sem versao alembic. Aplicando stamp..."
  alembic stamp head
  alembic upgrade head
fi

echo "==> Executando seed de dados iniciais..."
python scripts/seed.py

echo "==> Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 "$@"
