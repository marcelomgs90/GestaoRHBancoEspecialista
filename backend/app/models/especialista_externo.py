from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, DeclarativeBase

class ExternalBase(DeclarativeBase):
    """Base separada para evitar que o Alembic tente gerenciar tabelas externas."""
    pass

class UsersSpecialistType(ExternalBase):
    """Mapeamento da tabela de tipos de especialista no banco externo.

    Usada para filtrar pesquisadores-servidor via INNER JOIN em vez de uma
    coluna `tipo_vinculo` (que nao existe no schema externo real).
    """
    __tablename__ = "users_specialist_types"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)

    usuarios = relationship("UsuarioExterno", back_populates="specialist_type")


class UsuarioExterno(ExternalBase):
    """Mapeamento da tabela de usuários no banco externo (public.users)."""
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    cpf = Column(String(14), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    specialist_type_id = Column(
        Integer,
        ForeignKey("public.users_specialist_types.id"),
        nullable=True,
    )

    especialistas = relationship("EspecialistaExterno", back_populates="usuario")
    specialist_type = relationship("UsersSpecialistType", back_populates="usuarios")


class EspecialistaExterno(ExternalBase):
    """Mapeamento da tabela de especialistas no banco externo (public.specialists)."""
    __tablename__ = "specialists"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("public.users.id"), nullable=False)

    usuario = relationship("UsuarioExterno", back_populates="especialistas")
