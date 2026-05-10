from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_user
from app.models.usuario_perfil import Usuario
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.solicitacao_rh import SolicitacaoRH
from app.utils.enums import StatusVersaoRH, FonteFinanciamento

router = APIRouter()


class VersaoResponse(BaseModel):
    id: int
    projeto_id: int
    numero_versao: int
    status: StatusVersaoRH

    class Config:
        from_attributes = True


class MembroComparacao(BaseModel):
    id: int
    ref_pesquisador: str
    nome_pesquisador: str
    categoria_bolsa: str
    carga_horaria_semanal: int
    valor_bolsa: float

    class Config:
        from_attributes = True


class ComparacaoResponse(BaseModel):
    antes: dict
    depois: dict
    diferencas: dict


@router.get("/{solicitacao_id}/versoes", response_model=List[VersaoResponse])
def listar_versoes(
    solicitacao_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar todas as versoes de RH relacionadas a solicitacao."""
    solicitacao = db.query(SolicitacaoRH).filter(SolicitacaoRH.id == solicitacao_id).first()

    if not solicitacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitacao nao encontrada"
        )

    versoes = db.query(VersaoRHProjeto).filter(
        VersaoRHProjeto.projeto_id == solicitacao.projeto_id
    ).order_by(VersaoRHProjeto.numero_versao).all()

    return versoes


@router.get("/{solicitacao_id}/comparacao", response_model=ComparacaoResponse)
def comparar_versoes(
    solicitacao_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Comparar equipe atual (antes) vs proposta (depois).

    Retorna membros agrupados por fonte de financiamento e
    lista de diferencas (inclusoes, alteracoes, encerramentos).
    """
    solicitacao = db.query(SolicitacaoRH).filter(SolicitacaoRH.id == solicitacao_id).first()

    if not solicitacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitacao nao encontrada"
        )

    # Buscar versao proposta (da solicitacao)
    versao_proposta = db.query(VersaoRHProjeto).filter(
        VersaoRHProjeto.solicitacao_id == solicitacao_id
    ).first()

    if not versao_proposta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solicitacao nao possui versao de RH"
        )

    # Buscar versao vigente anterior
    versao_vigente = db.query(VersaoRHProjeto).filter(
        VersaoRHProjeto.projeto_id == solicitacao.projeto_id,
        VersaoRHProjeto.status == StatusVersaoRH.VIGENTE
    ).first()

    def agrupar_por_fonte(versao_id: int) -> dict:
        """Agrupa membros por fonte de financiamento."""
        membros = db.query(PesquisadorProjeto).filter(
            PesquisadorProjeto.versao_rh_id == versao_id
        ).all()

        resultado = {
            FonteFinanciamento.EMPRESA.value: [],
            FonteFinanciamento.EMBRAPII.value: [],
            FonteFinanciamento.SEBRAE.value: [],
            FonteFinanciamento.IFPB.value: [],
        }

        for m in membros:
            resultado[m.fonte_financiamento.value].append({
                "id": m.id,
                "ref_pesquisador": m.ref_pesquisador,
                "nome_pesquisador": m.nome_pesquisador,
                "categoria_bolsa": m.categoria_bolsa.value,
                "carga_horaria_semanal": m.carga_horaria_semanal,
                "valor_bolsa": float(m.valor_bolsa)
            })

        return resultado

    # Montar resposta
    antes = agrupar_por_fonte(versao_vigente.id) if versao_vigente else {
        FonteFinanciamento.EMPRESA.value: [],
        FonteFinanciamento.EMBRAPII.value: [],
        FonteFinanciamento.SEBRAE.value: [],
        FonteFinanciamento.IFPB.value: [],
    }

    depois = agrupar_por_fonte(versao_proposta.id)

    # Calcular diferencas
    diferencas = calcular_diferencas(antes, depois)

    return ComparacaoResponse(
        antes=antes,
        depois=depois,
        diferencas=diferencas
    )


def calcular_diferencas(antes: dict, depois: dict) -> dict:
    """Calcula inclusoes, alteracoes e encerramentos."""
    inclusoes = []
    alteracoes = []
    encerramentos = []

    # Criar mapa de pesquisadores antes
    mapa_antes = {}
    for fonte, membros in antes.items():
        for m in membros:
            chave = f"{m['ref_pesquisador']}_{fonte}"
            mapa_antes[chave] = m

    # Criar mapa de pesquisadores depois
    mapa_depois = {}
    for fonte, membros in depois.items():
        for m in membros:
            chave = f"{m['ref_pesquisador']}_{fonte}"
            mapa_depois[chave] = m

    # Identificar inclusoes e alteracoes
    for chave, membro_depois in mapa_depois.items():
        if chave not in mapa_antes:
            inclusoes.append({
                "pesquisador": membro_depois["nome_pesquisador"],
                "categoria": membro_depois["categoria_bolsa"],
                "fonte": chave.split("_")[1]
            })
        else:
            membro_antes = mapa_antes[chave]
            # Verificar alteracoes
            if membro_antes["carga_horaria_semanal"] != membro_depois["carga_horaria_semanal"]:
                alteracoes.append({
                    "pesquisador": membro_depois["nome_pesquisador"],
                    "campo": "carga_horaria_semanal",
                    "de": membro_antes["carga_horaria_semanal"],
                    "para": membro_depois["carga_horaria_semanal"]
                })

    # Identificar encerramentos
    for chave, membro_antes in mapa_antes.items():
        if chave not in mapa_depois:
            encerramentos.append({
                "pesquisador": membro_antes["nome_pesquisador"],
                "motivo": "Encerramento de participacao"
            })

    return {
        "inclusoes": inclusoes,
        "alteracoes": alteracoes,
        "encerramentos": encerramentos
    }
