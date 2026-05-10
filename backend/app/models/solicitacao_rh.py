from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import TipoSolicitacao, StatusSolicitacao


class SolicitacaoRH(Base, TimestampMixin):
    """Solicitacao de RH (Implantacao, Alteracao, Pagamento)."""
    __tablename__ = "solicitacao_rh"

    id = Column(Integer, primary_key=True, index=True)

    # Identificador manual/informado pelo usuario
    identificador = Column(String(50), nullable=False, index=True)

    projeto_id = Column(Integer, ForeignKey("projeto.id"), nullable=False)
    tipo = Column(SQLEnum(TipoSolicitacao), nullable=False)
    status = Column(SQLEnum(StatusSolicitacao), default=StatusSolicitacao.EM_EDICAO, nullable=False)

    # Para solicitacoes de pagamento
    mes_ano_referencia = Column(String(7), nullable=True)  # YYYY-MM

    # Justificativa
    justificativa = Column(Text, nullable=True)

    # Usuario que criou
    criado_por = Column(Integer, ForeignKey("usuario.id"), nullable=False)

    # Relacionamentos
    projeto = relationship("Projeto", back_populates="solicitacoes")
    criado_por_usuario = relationship("Usuario", back_populates="solicitacoes")

    # Versao gerada por esta solicitacao
    versao_gerada = relationship(
        "VersaoRHProjeto",
        back_populates="solicitacao",
        foreign_keys="VersaoRHProjeto.solicitacao_id",
        uselist=False
    )
