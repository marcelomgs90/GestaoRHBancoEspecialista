from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, DateTime
from datetime import datetime


class Base(DeclarativeBase):
    """Classe base para todos os modelos SQLAlchemy."""
    pass


class TimestampMixin:
    """Mixin para adicionar campos de auditoria de data/hora."""
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
