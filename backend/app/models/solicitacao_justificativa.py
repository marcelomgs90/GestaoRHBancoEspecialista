from sqlalchemy import Column, Enum as SQLEnum, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import TipoJustificativaSolicitacao


class SolicitacaoJustificativa(Base, TimestampMixin):
    """Justificativa separada por evento da solicitacao."""

    __tablename__ = "solicitacao_justificativa"
    __table_args__ = (
        UniqueConstraint(
            "solicitacao_id",
            "tipo",
            name="uq_solicitacao_justificativa_tipo",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    solicitacao_id = Column(Integer, ForeignKey("solicitacao_rh.id"), nullable=False, index=True)
    tipo = Column(SQLEnum(TipoJustificativaSolicitacao), nullable=False, index=True)
    descricao = Column(Text, nullable=False)
    criado_por = Column(Integer, ForeignKey("usuario.id"), nullable=False)

    solicitacao = relationship("SolicitacaoRH", back_populates="justificativas")
    criado_por_usuario = relationship("Usuario")
