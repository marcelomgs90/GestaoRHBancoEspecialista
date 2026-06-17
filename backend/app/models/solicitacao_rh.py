from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin
from app.utils.enums import TipoJustificativaSolicitacao, TipoSolicitacao, StatusSolicitacao


class SolicitacaoRH(Base, TimestampMixin):
    """Solicitação de RH (Implantação, Alteração, Pagamento)."""
    __tablename__ = "solicitacao_rh"

    id = Column(Integer, primary_key=True, index=True)

    # Identificador manual/informado pelo usuário
    identificador = Column(String(50), nullable=False, index=True)

    projeto_id = Column(Integer, ForeignKey("projeto.id"), nullable=False)
    tipo = Column(SQLEnum(TipoSolicitacao), nullable=False)
    status = Column(SQLEnum(StatusSolicitacao), default=StatusSolicitacao.EM_EDICAO, nullable=False)

    # Para solicitações de pagamento
    mes_ano_referencia = Column(String(7), nullable=True)  # YYYY-MM

    # Usuário que criou
    criado_por = Column(Integer, ForeignKey("usuario.id"), nullable=False)

    # Relacionamentos
    projeto = relationship("Projeto", back_populates="solicitacoes")
    criado_por_usuario = relationship("Usuario", back_populates="solicitacoes")

    # Versão gerada por esta solicitação
    versao_gerada = relationship(
        "VersaoRHProjeto",
        back_populates="solicitacao",
        foreign_keys="VersaoRHProjeto.solicitacao_id",
        uselist=False
    )
    justificativas = relationship(
        "SolicitacaoJustificativa",
        back_populates="solicitacao",
        cascade="all, delete-orphan",
    )

    def obter_justificativa(self, tipo: TipoJustificativaSolicitacao):
        for justificativa in self.justificativas or []:
            if justificativa.tipo == tipo:
                return justificativa.descricao
        return None

    @property
    def justificativa_implantacao(self):
        return self.obter_justificativa(TipoJustificativaSolicitacao.IMPLANTACAO)

    @property
    def justificativa_alteracao(self):
        return self.obter_justificativa(TipoJustificativaSolicitacao.ALTERACAO)

    @property
    def justificativa_rejeicao(self):
        return self.obter_justificativa(TipoJustificativaSolicitacao.REJEICAO)

    @property
    def justificativa_evento(self):
        if self.tipo == TipoSolicitacao.IMPLANTACAO:
            return self.justificativa_implantacao
        if self.tipo == TipoSolicitacao.ALTERACAO:
            return self.justificativa_alteracao
        return None
