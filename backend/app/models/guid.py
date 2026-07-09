"""Tipo UUID compativel com SQLite (testes) e PostgreSQL (producao).

SQLAlchemy nao fornece um tipo UUID compativel com SQLite por padrao.
`sqlalchemy.dialects.postgresql.UUID` falha em `metadata.create_all` quando
o engine e SQLite (usado nos testes). Este decorator encapsula a escolha:
usa `PGUUID` em PostgreSQL e `String(36)` em SQLite (e demais).
"""

from uuid import UUID

from sqlalchemy import String, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as PGUUID


class GUID(TypeDecorator):
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PGUUID(as_uuid=True))
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UUID):
            return value
        return UUID(str(value))
