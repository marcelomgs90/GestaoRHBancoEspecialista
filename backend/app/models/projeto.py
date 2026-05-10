from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import StatusProjeto


class Projeto(Base, TimestampMixin):
    """Modelo de projeto de PD&I."""
    __tablename__ = "projeto"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    titulo = Column(String(500), nullable=False)
    descricao = Column(Text, nullable=True)

    # Datas
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=False)

    # Coordenador
    coordenador_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)

    # Status
    status = Column(SQLEnum(StatusProjeto), default=StatusProjeto.ATIVO, nullable=False)

    # Relacionamentos
    coordenador = relationship("Usuario", back_populates="projetos_coordenados")
    anexos = relationship("ProjetoAnexo", back_populates="projeto")
    versoes_rh = relationship("VersaoRHProjeto", back_populates="projeto")
    solicitacoes = relationship("SolicitacaoRH", back_populates="projeto")
