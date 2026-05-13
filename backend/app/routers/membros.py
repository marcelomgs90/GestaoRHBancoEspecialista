from typing import List, Optional

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user, get_membro_service
from app.models.usuario_perfil import Usuario
from app.schemas.membro import MembroCreate, MembroResponse, MembroUpdate
from app.services.membro_service import MembroService

router = APIRouter()


@router.post("/{solicitacao_id}/membros", response_model=MembroResponse, status_code=status.HTTP_201_CREATED)
def incluir_membro(
    solicitacao_id: int,
    dados: MembroCreate,
    service: MembroService = Depends(get_membro_service),
    _: Usuario = Depends(get_current_user),
):
    """
    Incluir membro na solicitacao de RH.

    - Calcula valor_bolsa automaticamente via Parametro_Regra vigente
    - Valida carga horaria global do pesquisador
    """
    return service.incluir(solicitacao_id, dados)


@router.get("/{solicitacao_id}/membros", response_model=List[MembroResponse])
def listar_membros(
    solicitacao_id: int,
    service: MembroService = Depends(get_membro_service),
    _: Usuario = Depends(get_current_user),
):
    """Listar membros da solicitacao de RH."""
    return service.listar(solicitacao_id)


@router.put("/{solicitacao_id}/membros/{membro_id}", response_model=MembroResponse)
def atualizar_membro(
    solicitacao_id: int,
    membro_id: int,
    dados: MembroUpdate,
    service: MembroService = Depends(get_membro_service),
    _: Usuario = Depends(get_current_user),
):
    """Atualizar dados de um membro."""
    return service.atualizar(solicitacao_id, membro_id, dados)


@router.delete("/{solicitacao_id}/membros/{membro_id}")
def encerrar_membro(
    solicitacao_id: int,
    membro_id: int,
    motivo: Optional[str] = None,
    service: MembroService = Depends(get_membro_service),
    _: Usuario = Depends(get_current_user),
):
    """Encerrar participacao de um membro."""
    service.encerrar(solicitacao_id, membro_id, motivo)
    return {"message": "Participacao encerrada com sucesso"}
