from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.solicitacao_rh import SolicitacaoRH
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.schemas.versao import ComparacaoResponse
from app.utils.enums import FonteFinanciamento, StatusSolicitacao, StatusVersaoRH

_FONTES_VAZIAS = {
    FonteFinanciamento.EMPRESA.value: [],
    FonteFinanciamento.EMBRAPII.value: [],
    FonteFinanciamento.SEBRAE.value: [],
    FonteFinanciamento.IFPB.value: [],
}


class VersaoService:
    def __init__(self, db: Session):
        self.db = db

    def listar_por_projeto(self, projeto_id: int) -> List[VersaoRHProjeto]:
        return (
            self.db.query(VersaoRHProjeto)
            .filter(VersaoRHProjeto.projeto_id == projeto_id)
            .order_by(VersaoRHProjeto.criado_em.desc())
            .all()
        )

    def listar_pesquisadores_vigentes(
        self, projeto_id: int, page: int = 1, per_page: int = 20
    ) -> tuple[List[PesquisadorProjeto], int]:
        """
        Lista paginada dos pesquisadores da versão VIGENTE do projeto.
        Retorna (itens, total). Se não houver versão vigente, retorna ([], 0).
        """
        page = max(page, 1)
        per_page = max(min(per_page, 100), 1)

        versao_vigente = (
            self.db.query(VersaoRHProjeto)
            .filter(
                VersaoRHProjeto.projeto_id == projeto_id,
                VersaoRHProjeto.status == StatusVersaoRH.VIGENTE,
            )
            .first()
        )
        if not versao_vigente:
            return [], 0

        base_query = self.db.query(PesquisadorProjeto).filter(
            PesquisadorProjeto.versao_rh_id == versao_vigente.id
        )
        total = base_query.count()
        itens = (
            base_query.order_by(PesquisadorProjeto.nome_pesquisador.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return itens, total

    def listar_pesquisadores_da_versao_corrente(
        self, projeto_id: int, page: int = 1, per_page: int = 20
    ) -> tuple[List[PesquisadorProjeto], int, bool]:
        """
        Lista paginada dos pesquisadores da versão corrente do projeto.
        Retorna (itens, total, is_rascunho).

        Comportamento (membros só passam a valer após aprovação):
        - Se houver solicitação EM_EDICAO, retorna a versão PROPOSTA (is_rascunho=True).
          O coordenador está editando o rascunho.
        - Se houver solicitação SUBMETIDA, retorna a versão PROPOSTA (is_rascunho=False).
          As mudanças estão pendentes de aprovação e ainda não afetam a equipe oficial.
        - Se houver solicitação APROVADA, retorna a versão VIGENTE (is_rascunho=False).
          Equipe oficial vigente.
        - Se houver solicitação REJEITADA, retorna a VIGENTE atual (is_rascunho=False).
          A VIGENTE nunca foi alterada durante a submissão, então as mudanças foram
          descartadas e a equipe oficial permanece como antes.
        - Caso contrário, retorna a VIGENTE atual (is_rascunho=False).
        """
        page = max(page, 1)
        per_page = max(min(per_page, 100), 1)

        solicitacao_em_edicao_ou_submetida = (
            self.db.query(SolicitacaoRH)
            .filter(
                SolicitacaoRH.projeto_id == projeto_id,
                SolicitacaoRH.status.in_(
                    [StatusSolicitacao.EM_EDICAO, StatusSolicitacao.SUBMETIDA]
                ),
            )
            .order_by(SolicitacaoRH.criado_em.desc())
            .first()
        )

        if solicitacao_em_edicao_ou_submetida:
            versao = (
                self.db.query(VersaoRHProjeto)
                .filter(
                    VersaoRHProjeto.solicitacao_id == solicitacao_em_edicao_ou_submetida.id,
                    VersaoRHProjeto.status == StatusVersaoRH.PROPOSTA,
                )
                .first()
            )
            is_rascunho = (
                solicitacao_em_edicao_ou_submetida.status == StatusSolicitacao.EM_EDICAO
            )
        else:
            versao = (
                self.db.query(VersaoRHProjeto)
                .filter(
                    VersaoRHProjeto.projeto_id == projeto_id,
                    VersaoRHProjeto.status == StatusVersaoRH.VIGENTE,
                )
                .first()
            )
            is_rascunho = False

        if not versao:
            return [], 0, is_rascunho

        base_query = self.db.query(PesquisadorProjeto).filter(
            PesquisadorProjeto.versao_rh_id == versao.id
        )
        total = base_query.count()
        itens = (
            base_query.order_by(PesquisadorProjeto.nome_pesquisador.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return itens, total, is_rascunho

    def listar(self, solicitacao_id: int) -> List[VersaoRHProjeto]:
        solicitacao = self._buscar_solicitacao(solicitacao_id)
        return (
            self.db.query(VersaoRHProjeto)
            .filter(VersaoRHProjeto.projeto_id == solicitacao.projeto_id)
            .order_by(VersaoRHProjeto.numero_versao)
            .all()
        )

    def comparar(self, solicitacao_id: int) -> ComparacaoResponse:
        solicitacao = self._buscar_solicitacao(solicitacao_id)

        versao_proposta = (
            self.db.query(VersaoRHProjeto)
            .filter(VersaoRHProjeto.solicitacao_id == solicitacao_id)
            .first()
        )
        if not versao_proposta:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solicitação não possui versão de RH",
            )

        versao_vigente = (
            self.db.query(VersaoRHProjeto)
            .filter(
                VersaoRHProjeto.projeto_id == solicitacao.projeto_id,
                VersaoRHProjeto.status == StatusVersaoRH.VIGENTE,
            )
            .first()
        )

        antes = (
            self._agrupar_por_fonte(versao_vigente.id)
            if versao_vigente
            else {k: [] for k in _FONTES_VAZIAS}
        )
        depois = self._agrupar_por_fonte(versao_proposta.id)
        diferencas = self._calcular_diferencas(antes, depois)

        return ComparacaoResponse(antes=antes, depois=depois, diferencas=diferencas)

    def _buscar_solicitacao(self, solicitacao_id: int) -> SolicitacaoRH:
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

    def _agrupar_por_fonte(self, versao_id: int) -> dict:
        membros = (
            self.db.query(PesquisadorProjeto)
            .filter(PesquisadorProjeto.versao_rh_id == versao_id)
            .all()
        )

        resultado: dict = {k: [] for k in _FONTES_VAZIAS}
        for m in membros:
            resultado[m.fonte_financiamento.value].append(
                {
                    "id": m.id,
                    "ref_pesquisador": m.ref_pesquisador,
                    "nome_pesquisador": m.nome_pesquisador,
                    "categoria_bolsa": m.categoria_bolsa.value,
                    "carga_horaria_semanal": m.carga_horaria_semanal,
                    "valor_bolsa": float(m.valor_bolsa),
                }
            )

        return resultado

    @staticmethod
    def _calcular_diferencas(antes: dict, depois: dict) -> dict:
        inclusoes: list = []
        alteracoes: list = []
        encerramentos: list = []

        mapa_antes = {
            f"{m['ref_pesquisador']}_{fonte}": m
            for fonte, membros in antes.items()
            for m in membros
        }
        mapa_depois = {
            f"{m['ref_pesquisador']}_{fonte}": m
            for fonte, membros in depois.items()
            for m in membros
        }

        for chave, membro_depois in mapa_depois.items():
            if chave not in mapa_antes:
                inclusoes.append(
                    {
                        "pesquisador": membro_depois["nome_pesquisador"],
                        "categoria": membro_depois["categoria_bolsa"],
                        "fonte": chave.split("_")[1],
                    }
                )
            else:
                membro_antes = mapa_antes[chave]
                if (
                    membro_antes["carga_horaria_semanal"]
                    != membro_depois["carga_horaria_semanal"]
                ):
                    alteracoes.append(
                        {
                            "pesquisador": membro_depois["nome_pesquisador"],
                            "campo": "carga_horaria_semanal",
                            "de": membro_antes["carga_horaria_semanal"],
                            "para": membro_depois["carga_horaria_semanal"],
                        }
                    )

        for chave, membro_antes in mapa_antes.items():
            if chave not in mapa_depois:
                encerramentos.append(
                    {
                        "pesquisador": membro_antes["nome_pesquisador"],
                        "motivo": "Encerramento de participação",
                    }
                )

        return {
            "inclusoes": inclusoes,
            "alteracoes": alteracoes,
            "encerramentos": encerramentos,
        }
