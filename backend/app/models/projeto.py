from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import StatusProjeto


class Projeto(Base, TimestampMixin):
    """Modelo de projeto de PD&I."""
    __tablename__ = "projeto"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=True, index=True)
    sigla = Column(String(20), unique=True, nullable=False, index=True)
    titulo = Column(String(500), nullable=False)
    descricao = Column(Text, nullable=True)

    # Datas
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=False)

    # Coordenador
    coordenador_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    criado_por_id = Column(Integer, ForeignKey("usuario.id"), nullable=True, index=True)

    # Status
    status = Column(SQLEnum(StatusProjeto), default=StatusProjeto.ATIVO, nullable=False)

    # Relacionamentos
    coordenador = relationship(
        "Usuario",
        back_populates="projetos_coordenados",
        foreign_keys=[coordenador_id],
    )
    criado_por_usuario = relationship(
        "Usuario",
        back_populates="projetos_criados",
        foreign_keys=[criado_por_id],
    )
    fontes_financiamento = relationship(
        "ProjetoFonteFinanciamento",
        back_populates="projeto",
        cascade="all, delete-orphan",
    )
    anexos = relationship("ProjetoAnexo", back_populates="projeto")
    versoes_rh = relationship("VersaoRHProjeto", back_populates="projeto")
    solicitacoes = relationship("SolicitacaoRH", back_populates="projeto")

    @property
    def coordenador_nome(self):
        return self.coordenador.nome if self.coordenador else None

    @property
    def usuario_nome(self):
        return self.coordenador.nome if self.coordenador else None
