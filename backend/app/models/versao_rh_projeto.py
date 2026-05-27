from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import Base
from app.utils.enums import StatusVersaoRH


class VersaoRHProjeto(Base):
    """
    Versão de RH do projeto - snapshot da composição da equipe.
    Registros de Pesquisador_Projeto vinculam-se a uma versão específica via versao_rh_id.
    """
    __tablename__ = "versao_rh_projeto"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projeto.id"), nullable=False)

    numero_versao = Column(Integer, nullable=False)
    status = Column(SQLEnum(StatusVersaoRH), default=StatusVersaoRH.PROPOSTA, nullable=False)

    # Referência à solicitação que gerou esta versão
    solicitacao_id = Column(Integer, ForeignKey("solicitacao_rh.id"), nullable=True)

    # Auditoria
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relacionamentos
    projeto = relationship("Projeto", back_populates="versoes_rh")
    membros = relationship("PesquisadorProjeto", back_populates="versao_rh")
    solicitacao = relationship("SolicitacaoRH", back_populates="versao_gerada", foreign_keys=[solicitacao_id])
