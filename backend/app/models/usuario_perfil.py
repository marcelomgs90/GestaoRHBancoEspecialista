from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import PerfilUsuario


class Usuario(Base, TimestampMixin):
    """Modelo de usuário do sistema."""
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, index=True)
    ref_usuario = Column(String(100), unique=True, nullable=False, index=True)
    nome = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    perfil = Column(SQLEnum(PerfilUsuario), nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    senha_definida = Column(Boolean, default=True, nullable=False)
    convite_token_hash = Column(String(255), nullable=True)
    convite_expira_em = Column(DateTime, nullable=True)

    # Relacionamentos
    projetos_coordenados = relationship(
        "Projeto",
        back_populates="coordenador",
        foreign_keys="Projeto.coordenador_id",
    )
    projetos_criados = relationship(
        "Projeto",
        back_populates="criado_por_usuario",
        foreign_keys="Projeto.criado_por_id",
    )
    solicitacoes = relationship("SolicitacaoRH", back_populates="criado_por_usuario")


class Perfil(Base):
    """Modelo de perfil (para referência/lookup)."""
    __tablename__ = "perfil"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(SQLEnum(PerfilUsuario), unique=True, nullable=False)
    descricao = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
