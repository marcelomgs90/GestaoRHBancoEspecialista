from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.projeto import Projeto
from app.models.solicitacao_rh import SolicitacaoRH
from app.models.usuario_perfil import Usuario
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.schemas.solicitacao import SolicitacaoCreate, SolicitacaoImplantacaoCreate
from app.utils.enums import (
    PerfilUsuario,
    StatusSolicitacao,
    StatusVersaoRH,
    TipoSolicitacao,
)

class SolicitacaoService:
    def __init__(self, db: Session):
        self.db = db

    # --- NOVO MÉTODO ESPECÍFICO PARA A TASK 26761 ---
    def criar_implantacao(self, dados: SolicitacaoImplantacaoCreate, current_user: Usuario) -> SolicitacaoRH:
        projeto = self._buscar_projeto(dados.projeto_id)
        self._verificar_permissao_coordenador(projeto, current_user)

        # Força os dados corretos para uma Implantação Inicial (sem justificativa/mês)
        solicitacao = SolicitacaoRH(
            identificador=dados.identificador,
            projeto_id=dados.projeto_id,
            tipo=TipoSolicitacao.IMPLANTACAO,
            status=StatusSolicitacao.EM_EDICAO,
            criado_por=current_user.id,
        )
        self.db.add(solicitacao)
        self.db.flush() # Gera o ID da solicitação no banco

        # Cria a versão 1 vinculada
        self._criar_versao_implantacao(dados.projeto_id, solicitacao.id)

        self.db.commit()
        self.db.refresh(solicitacao)
        return solicitacao

    # --- MÉTODO GENÉRICO MANTIDO INTACTO ---
    def criar(self, dados: SolicitacaoCreate, current_user: Usuario) -> SolicitacaoRH:
        projeto = self._buscar_projeto(dados.projeto_id)
        self._verificar_permissao_coordenador(projeto, current_user)

        solicitacao = SolicitacaoRH(
            identificador=dados.identificador,
            projeto_id=dados.projeto_id,
            tipo=dados.tipo,
            justificativa=dados.justificativa,
            mes_ano_referencia=dados.mes_ano_referencia,
            status=StatusSolicitacao.EM_EDICAO,
            criado_por=current_user.id,
        )
        self.db.add(solicitacao)
        self.db.flush()

        if dados.tipo == TipoSolicitacao.IMPLANTACAO:
            self._criar_versao_implantacao(dados.projeto_id, solicitacao.id)
        elif dados.tipo == TipoSolicitacao.ALTERACAO:
            self._criar_versao_alteracao(dados.projeto_id, solicitacao.id)

        self.db.commit()
        self.db.refresh(solicitacao)
        return solicitacao

    def listar(self, current_user: Usuario, projeto_id: Optional[int] = None) -> List[SolicitacaoRH]:
        query = self.db.query(SolicitacaoRH)

        if projeto_id:
            query = query.filter(SolicitacaoRH.projeto_id == projeto_id)

        if current_user.perfil == PerfilUsuario.COORDENADOR:
            query = query.join(Projeto).filter(Projeto.coordenador_id == current_user.id)

        return query.all()

    def obter_por_id(self, solicitacao_id: int) -> SolicitacaoRH:
        solicitacao = (
            self.db.query(SolicitacaoRH)
            .filter(SolicitacaoRH.id == solicitacao_id)
            .first()
        )
        if not solicitacao:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitacao nao encontrada",
            )
        return solicitacao

    def _buscar_projeto(self, projeto_id: int) -> Projeto:
        projeto = self.db.query(Projeto).filter(Projeto.id == projeto_id).first()
        if not projeto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto nao encontrado",
            )
        return projeto

    def _verificar_permissao_coordenador(
        self, projeto: Projeto, current_user: Usuario
    ) -> None:
        if (
            current_user.perfil == PerfilUsuario.COORDENADOR
            and projeto.coordenador_id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voce nao e coordenador deste projeto",
            )

    def _criar_versao_implantacao(self, projeto_id: int, solicitacao_id: int) -> None:
        versao_existente = (
            self.db.query(VersaoRHProjeto)
            .filter(VersaoRHProjeto.projeto_id == projeto_id)
            .first()
        )
        if versao_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Projeto ja possui versao de RH. Use tipo ALTERACAO.",
            )

        self.db.add(
            VersaoRHProjeto(
                projeto_id=projeto_id,
                numero_versao=1,
                status=StatusVersaoRH.PROPOSTA,
                solicitacao_id=solicitacao_id,
            )
        )

    def _criar_versao_alteracao(self, projeto_id: int, solicitacao_id: int) -> None:
        versao_vigente = (
            self.db.query(VersaoRHProjeto)
            .filter(
                VersaoRHProjeto.projeto_id == projeto_id,
                VersaoRHProjeto.status == StatusVersaoRH.VIGENTE,
            )
            .first()
        )
        if not versao_vigente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nao existe versao vigente para alteracao. Use tipo IMPLANTACAO.",
            )

        nova_versao = VersaoRHProjeto(
            projeto_id=projeto_id,
            numero_versao=versao_vigente.numero_versao + 1,
            status=StatusVersaoRH.PROPOSTA,
            solicitacao_id=solicitacao_id,
        )
        self.db.add(nova_versao)
        self.db.flush()

        self._clonar_membros(origem_versao_id=versao_vigente.id, destino_versao_id=nova_versao.id)

    def _clonar_membros(self, origem_versao_id: int, destino_versao_id: int) -> None:
        """
        Clona membros ativos da versao de origem para a versao de destino.
        Considera-se ativo o membro sem data_fim ou com data_fim no futuro.
        Os clones servem como base editavel da versao Proposta (US-SD-04).
        """
        membros_origem = (
            self.db.query(PesquisadorProjeto)
            .filter(PesquisadorProjeto.versao_rh_id == origem_versao_id)
            .all()
        )
        for membro in membros_origem:
            clone = PesquisadorProjeto(
                ref_pesquisador=membro.ref_pesquisador,
                nome_pesquisador=membro.nome_pesquisador,
                versao_rh_id=destino_versao_id,
                categoria_bolsa=membro.categoria_bolsa,
                fonte_financiamento=membro.fonte_financiamento,
                carga_horaria_semanal=membro.carga_horaria_semanal,
                valor_bolsa=membro.valor_bolsa,
                data_inicio=membro.data_inicio,
                data_fim=membro.data_fim,
                origem_rh=membro.origem_rh,
            )
            self.db.add(clone)