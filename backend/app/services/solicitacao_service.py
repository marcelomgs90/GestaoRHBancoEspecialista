from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.projeto import Projeto
from app.models.solicitacao_rh import SolicitacaoRH
from app.models.usuario_perfil import Usuario
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.schemas.solicitacao import SolicitacaoCreate, SolicitacaoImplantacaoCreate
from app.utils.enums import (
    FonteFinanciamento,
    PerfilUsuario,
    StatusProjeto,
    StatusSolicitacao,
    StatusVersaoRH,
    TipoSolicitacao,
)

class SolicitacaoService:
    def __init__(self, db: Session):
        self.db = db

    def _buscar_implantacao_existente(self, projeto_id: int) -> Optional[SolicitacaoRH]:
        return (
            self.db.query(SolicitacaoRH)
            .filter(
                SolicitacaoRH.projeto_id == projeto_id,
                SolicitacaoRH.tipo == TipoSolicitacao.IMPLANTACAO,
                SolicitacaoRH.status == StatusSolicitacao.EM_EDICAO,
            )
            .first()
        )

    def _buscar_alteracao_existente(self, projeto_id: int) -> Optional[SolicitacaoRH]:
        return (
            self.db.query(SolicitacaoRH)
            .filter(
                SolicitacaoRH.projeto_id == projeto_id,
                SolicitacaoRH.tipo == TipoSolicitacao.ALTERACAO,
                SolicitacaoRH.status == StatusSolicitacao.EM_EDICAO,
            )
            .first()
        )

    def criar_implantacao(self, dados: SolicitacaoImplantacaoCreate, current_user: Usuario) -> SolicitacaoRH:
        projeto = self._buscar_projeto(dados.projeto_id)
        self._verificar_permissao_edicao(projeto, current_user)

        existente = self._buscar_implantacao_existente(dados.projeto_id)
        if existente:
            return existente

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
        self._verificar_permissao_edicao(projeto, current_user)

        if dados.tipo == TipoSolicitacao.IMPLANTACAO:
            existente = self._buscar_implantacao_existente(dados.projeto_id)
            if existente:
                return existente
        elif dados.tipo == TipoSolicitacao.ALTERACAO:
            existente = self._buscar_alteracao_existente(dados.projeto_id)
            if existente:
                return existente

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
                detail="Solicitação não encontrada",
            )
        return solicitacao

    def _buscar_projeto(self, projeto_id: int) -> Projeto:
        projeto = self.db.query(Projeto).filter(Projeto.id == projeto_id).first()
        if not projeto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado",
            )
        if projeto.status != StatusProjeto.ATIVO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solicitação só pode ser vinculada a projeto ativo",
            )
        return projeto

    def _verificar_permissao_edicao(
        self, projeto: Projeto, current_user: Usuario
    ) -> None:
        if current_user.perfil in (PerfilUsuario.ADMINISTRADOR, PerfilUsuario.APOIO_COORDENADOR):
            return

        if current_user.perfil == PerfilUsuario.COORDENADOR and projeto.coordenador_id == current_user.id:
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario nao tem permissao para editar solicitacoes deste projeto",
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
                detail="Projeto já possui versão de RH. Use tipo ALTERACAO.",
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
                detail="Não existe versão vigente para alteração. Use tipo IMPLANTAÇÃO.",
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

    def submeter(self, solicitacao_id: int, current_user: Usuario) -> SolicitacaoRH:
        solicitacao = self.obter_por_id(solicitacao_id)

        if solicitacao.status != StatusSolicitacao.EM_EDICAO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solicitação não está em edição.",
            )

        projeto = self._buscar_projeto(solicitacao.projeto_id)
        self._verificar_permissao_edicao(projeto, current_user)

        solicitacao.status = StatusSolicitacao.SUBMETIDA

        self.db.commit()
        self.db.refresh(solicitacao)
        return solicitacao

    def comparar(self, solicitacao_id: int) -> Dict[str, Any]:
        solicitacao = self.obter_por_id(solicitacao_id)

        versao_proposta = (
            self.db.query(VersaoRHProjeto)
            .filter(VersaoRHProjeto.solicitacao_id == solicitacao_id)
            .first()
        )
        if not versao_proposta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Versão de RH não encontrada para esta solicitação.",
            )

        membros_depois = (
            self.db.query(PesquisadorProjeto)
            .filter(PesquisadorProjeto.versao_rh_id == versao_proposta.id)
            .all()
        )
        depois = self._agrupar_por_fonte(membros_depois)

        if solicitacao.tipo == TipoSolicitacao.IMPLANTACAO:
            antes: Dict[str, List] = {}
            inclusoes = [
                {
                    "pesquisador": m.nome_pesquisador,
                    "categoria": m.categoria_bolsa.value,
                    "fonte": m.fonte_financiamento.value,
                }
                for m in membros_depois
            ]
            return {
                "antes": antes,
                "depois": depois,
                "diferencas": {"inclusoes": inclusoes, "alteracoes": [], "encerramentos": []},
            }

        # ALTERACAO: busca versão anterior pelo numero_versao - 1
        versao_anterior = (
            self.db.query(VersaoRHProjeto)
            .filter(
                VersaoRHProjeto.projeto_id == versao_proposta.projeto_id,
                VersaoRHProjeto.numero_versao == versao_proposta.numero_versao - 1,
            )
            .first()
        )

        membros_antes: List[PesquisadorProjeto] = []
        if versao_anterior:
            membros_antes = (
                self.db.query(PesquisadorProjeto)
                .filter(PesquisadorProjeto.versao_rh_id == versao_anterior.id)
                .all()
            )

        antes = self._agrupar_por_fonte(membros_antes)

        refs_antes = {m.ref_pesquisador for m in membros_antes}
        refs_depois = {m.ref_pesquisador for m in membros_depois}

        inclusoes = [
            {
                "pesquisador": m.nome_pesquisador,
                "categoria": m.categoria_bolsa.value,
                "fonte": m.fonte_financiamento.value,
            }
            for m in membros_depois
            if m.ref_pesquisador not in refs_antes
        ]

        encerramentos = [
            {"pesquisador": m.nome_pesquisador, "motivo": "Removido na nova versão"}
            for m in membros_antes
            if m.ref_pesquisador not in refs_depois
        ]

        alteracoes = []
        mapa_antes = {m.ref_pesquisador: m for m in membros_antes}
        mapa_depois = {m.ref_pesquisador: m for m in membros_depois}
        for ref in refs_antes & refs_depois:
            m_a = mapa_antes[ref]
            m_d = mapa_depois[ref]
            for campo, de, para in [
                ("categoria_bolsa", m_a.categoria_bolsa.value, m_d.categoria_bolsa.value),
                ("fonte_financiamento", m_a.fonte_financiamento.value, m_d.fonte_financiamento.value),
                ("carga_horaria_semanal", m_a.carga_horaria_semanal, m_d.carga_horaria_semanal),
            ]:
                if de != para:
                    alteracoes.append({"pesquisador": m_a.nome_pesquisador, "campo": campo, "de": de, "para": para})

        return {
            "antes": antes,
            "depois": depois,
            "diferencas": {"inclusoes": inclusoes, "alteracoes": alteracoes, "encerramentos": encerramentos},
        }

    def _agrupar_por_fonte(self, membros: List[PesquisadorProjeto]) -> Dict[str, List]:
        grupos: Dict[str, List] = {}
        for fonte in FonteFinanciamento:
            lista = [
                {
                    "id": m.id,
                    "ref_pesquisador": m.ref_pesquisador,
                    "nome_pesquisador": m.nome_pesquisador,
                    "categoria_bolsa": m.categoria_bolsa.value,
                    "carga_horaria_semanal": m.carga_horaria_semanal,
                    "valor_bolsa": float(m.valor_bolsa) if m.valor_bolsa else 0.0,
                }
                for m in membros
                if m.fonte_financiamento == fonte
            ]
            if lista:
                grupos[fonte.value] = lista
        return grupos

    def _clonar_membros(self, origem_versao_id: int, destino_versao_id: int) -> None:
        """
        Clona membros ativos da versão de origem para a versão de destino.
        Considera-se ativo o membro sem data_fim ou com data_fim no futuro.
        Os clones servem como base editável da versão Proposta (US-SD-04).
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
        self.db.commit()

    def _verificar_permissao_aprovacao(self, projeto: Projeto, current_user: Usuario) -> None:
        if current_user.perfil == PerfilUsuario.ADMINISTRADOR:
            return

        if current_user.perfil == PerfilUsuario.COORDENADOR and projeto.coordenador_id == current_user.id:
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o coordenador do projeto ou Administrador pode realizar esta acao",
        )

    def aprovar(self, solicitacao_id: int, current_user: Usuario) -> SolicitacaoRH:
        solicitacao = self.obter_por_id(solicitacao_id)
        projeto = self._buscar_projeto(solicitacao.projeto_id)
        self._verificar_permissao_aprovacao(projeto, current_user)

        if solicitacao.status != StatusSolicitacao.SUBMETIDA:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas solicitações com status SUBMETIDA podem ser aprovadas",
            )

        versao = (
            self.db.query(VersaoRHProjeto)
            .filter(VersaoRHProjeto.solicitacao_id == solicitacao_id)
            .first()
        )
        if versao and versao.status == StatusVersaoRH.PROPOSTA:
            if solicitacao.tipo == TipoSolicitacao.ALTERACAO:
                versao_vigente = (
                    self.db.query(VersaoRHProjeto)
                    .filter(
                        VersaoRHProjeto.projeto_id == solicitacao.projeto_id,
                        VersaoRHProjeto.status == StatusVersaoRH.VIGENTE,
                    )
                    .first()
                )
                if versao_vigente:
                    versao_vigente.status = StatusVersaoRH.HISTORICO
            versao.status = StatusVersaoRH.VIGENTE

        solicitacao.status = StatusSolicitacao.APROVADA
        self.db.commit()
        self.db.refresh(solicitacao)
        return solicitacao

    def rejeitar(
        self, solicitacao_id: int, current_user: Usuario, justificativa: Optional[str] = None
    ) -> SolicitacaoRH:
        solicitacao = self.obter_por_id(solicitacao_id)
        projeto = self._buscar_projeto(solicitacao.projeto_id)
        self._verificar_permissao_aprovacao(projeto, current_user)

        if solicitacao.status != StatusSolicitacao.SUBMETIDA:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas solicitações com status SUBMETIDA podem ser rejeitadas",
            )

        solicitacao.status = StatusSolicitacao.REJEITADA
        if justificativa:
            solicitacao.justificativa = justificativa
        self.db.commit()
        self.db.refresh(solicitacao)
        return solicitacao
