from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, DeclarativeBase

class ExternalBase(DeclarativeBase):
    """Base separada para evitar que o Alembic tente gerenciar tabelas externas."""
    pass

class UsuarioExterno(ExternalBase):
    """Mapeamento da tabela de usuários no banco externo (public.users)."""
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    cpf = Column(String(14), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)

    especialistas = relationship("EspecialistaExterno", back_populates="usuario")

class EspecialistaExterno(ExternalBase):
    """Mapeamento da tabela de especialistas no banco externo (public.specialists)."""
    __tablename__ = "specialists"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("public.users.id"), nullable=False)

    usuario = relationship("UsuarioExterno", back_populates="especialistas")