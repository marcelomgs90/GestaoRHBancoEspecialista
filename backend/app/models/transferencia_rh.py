from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import StatusTransferencia


class TransferenciaRH(Base, TimestampMixin):
    """Transferência de pesquisador entre projetos."""
    __tablename__ = "transferencia_rh"

    id = Column(Integer, primary_key=True, index=True)

    # Pesquisador sendo transferido
    ref_pesquisador = Column(String(100), nullable=False, index=True)
    nome_pesquisador = Column(String(255), nullable=False)

    # Projetos
    projeto_origem_id = Column(Integer, ForeignKey("projeto.id"), nullable=False)
    projeto_destino_id = Column(Integer, ForeignKey("projeto.id"), nullable=False)

    # Coordenadores
    coordenador_solicitante_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    coordenador_cedente_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)

    # Status e parecer
    status = Column(SQLEnum(StatusTransferencia), default=StatusTransferencia.PENDENTE, nullable=False)
    justificativa_solicitacao = Column(Text, nullable=True)
    justificativa_parecer = Column(Text, nullable=True)
    data_parecer = Column(Date, nullable=True)

    # Solicitações geradas (origem e destino)
    solicitacao_origem_id = Column(Integer, ForeignKey("solicitacao_rh.id"), nullable=True)
    solicitacao_destino_id = Column(Integer, ForeignKey("solicitacao_rh.id"), nullable=True)
