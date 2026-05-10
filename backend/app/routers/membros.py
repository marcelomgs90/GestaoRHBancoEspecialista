from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from datetime import date

from app.core.dependencies import get_db, get_current_user
from app.models.usuario_perfil import Usuario
from app.models.solicitacao_rh import SolicitacaoRH
from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.utils.enums import FonteFinanciamento, CategoriaBolsa, StatusSolicitacao

router = APIRouter()


class MembroCreate(BaseModel):
    ref_pesquisador: str
    nome_pesquisador: str
    categoria_bolsa: CategoriaBolsa
    fonte_financiamento: FonteFinanciamento
    carga_horaria_semanal: int
    data_inicio: date
    data_fim: Optional[date] = None
    origem_rh: Optional[str] = None


class MembroUpdate(BaseModel):
    categoria_bolsa: Optional[CategoriaBolsa] = None
    fonte_financiamento: Optional[FonteFinanciamento] = None
    carga_horaria_semanal: Optional[int] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None


class MembroResponse(BaseModel):
    id: int
    ref_pesquisador: str
    nome_pesquisador: str
    categoria_bolsa: CategoriaBolsa
    fonte_financiamento: FonteFinanciamento
    carga_horaria_semanal: int
    valor_bolsa: Decimal
    data_inicio: date
    data_fim: Optional[date]
    origem_rh: Optional[str]

    class Config:
        from_attributes = True


@router.post("/{solicitacao_id}/membros", response_model=MembroResponse, status_code=status.HTTP_201_CREATED)
def incluir_membro(
    solicitacao_id: int,
    dados: MembroCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Incluir membro na solicitacao de RH.

    - Calcula valor_bolsa automaticamente via Parametro_Regra vigente
    - Valida carga horaria global do pesquisador
    """
    # Buscar solicitacao
    solicitacao = db.query(SolicitacaoRH).filter(SolicitacaoRH.id == solicitacao_id).first()
    if not solicitacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitacao nao encontrada"
        )

    # Verificar status
    if solicitacao.status != StatusSolicitacao.EM_EDICAO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solicitacao nao esta em edicao"
        )

    # Buscar versao de RH da solicitacao
    versao = db.query(VersaoRHProjeto).filter(
        VersaoRHProjeto.solicitacao_id == solicitacao_id
    ).first()

    if not versao:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solicitacao nao possui versao de RH associada"
        )

    # TODO: Validar carga horaria global
    # TODO: Calcular valor da bolsa via Parametro_Regra

    # Por enquanto, valor mockado
    valor_bolsa = Decimal("2500.00")

    membro = PesquisadorProjeto(
        ref_pesquisador=dados.ref_pesquisador,
        nome_pesquisador=dados.nome_pesquisador,
        versao_rh_id=versao.id,
        categoria_bolsa=dados.categoria_bolsa,
        fonte_financiamento=dados.fonte_financiamento,
        carga_horaria_semanal=dados.carga_horaria_semanal,
        valor_bolsa=valor_bolsa,
        data_inicio=dados.data_inicio,
        data_fim=dados.data_fim,
        origem_rh=dados.origem_rh
    )

    db.add(membro)
    db.commit()
    db.refresh(membro)

    return membro


@router.get("/{solicitacao_id}/membros", response_model=List[MembroResponse])
def listar_membros(
    solicitacao_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar membros da solicitacao de RH."""
    # Buscar versao de RH da solicitacao
    versao = db.query(VersaoRHProjeto).filter(
        VersaoRHProjeto.solicitacao_id == solicitacao_id
    ).first()

    if not versao:
        return []

    membros = db.query(PesquisadorProjeto).filter(
        PesquisadorProjeto.versao_rh_id == versao.id
    ).all()

    return membros


@router.put("/{solicitacao_id}/membros/{membro_id}", response_model=MembroResponse)
def atualizar_membro(
    solicitacao_id: int,
    membro_id: int,
    dados: MembroUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Atualizar dados de um membro."""
    membro = db.query(PesquisadorProjeto).filter(PesquisadorProjeto.id == membro_id).first()

    if not membro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro nao encontrado"
        )

    # Atualizar campos
    for field, value in dados.model_dump(exclude_unset=True).items():
        setattr(membro, field, value)

    # TODO: Recalcular valor da bolsa se CH mudou

    db.commit()
    db.refresh(membro)

    return membro


@router.delete("/{solicitacao_id}/membros/{membro_id}")
def encerrar_membro(
    solicitacao_id: int,
    membro_id: int,
    motivo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Encerrar participacao de um membro."""
    membro = db.query(PesquisadorProjeto).filter(PesquisadorProjeto.id == membro_id).first()

    if not membro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro nao encontrado"
        )

    membro.data_fim = date.today()
    membro.motivo_encerramento = motivo

    db.commit()

    return {"message": "Participacao encerrada com sucesso"}
