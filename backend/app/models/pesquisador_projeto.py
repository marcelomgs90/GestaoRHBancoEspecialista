from sqlalchemy import Column, Integer, String, Date, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import FonteFinanciamento, CategoriaBolsa


class PesquisadorProjeto(Base, TimestampMixin):
    """
    Vinculo de pesquisador ao projeto.
    Pesquisador (AIE) e uma entidade externa consultada via API do Banco de Especialistas.
    """
    __tablename__ = "pesquisador_projeto"

    id = Column(Integer, primary_key=True, index=True)

    # Referencia ao pesquisador na API externa (Banco de Especialistas)
    ref_pesquisador = Column(String(100), nullable=False, index=True)
    nome_pesquisador = Column(String(255), nullable=False)

    # Vínculo a versão de RH
    versao_rh_id = Column(Integer, ForeignKey("versao_rh_projeto.id"), nullable=False)

    # Dados do vinculo
    categoria_bolsa = Column(SQLEnum(CategoriaBolsa), nullable=False)
    fonte_financiamento = Column(SQLEnum(FonteFinanciamento), nullable=False)
    carga_horaria_semanal = Column(Integer, nullable=False)

    # Valores calculados
    valor_bolsa = Column(Numeric(10, 2), nullable=False)

    # Periodo
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=True)

    # Origem do RH (para rastreabilidade)
    origem_rh = Column(String(100), nullable=True)

    # Motivo de encerramento (se aplicavel)
    motivo_encerramento = Column(String(500), nullable=True)

    # Relacionamentos
    versao_rh = relationship("VersaoRHProjeto", back_populates="membros")
