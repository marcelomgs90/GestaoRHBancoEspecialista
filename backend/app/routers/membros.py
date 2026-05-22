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
    current_user: Usuario = Depends(get_current_user),
):
    """
    Incluir membro na solicitacao de RH.

    - Calcula valor_bolsa automaticamente via Parametro_Regra vigente
    - Valida carga horaria global do pesquisador
    - Exclusivo para o Coordenador do Projeto
    """
    return service.incluir(solicitacao_id, dados, usuario_logado_id=current_user.id)


@router.get("/{solicitacao_id}/membros", response_model=List[MembroResponse])
def listar_membros(
    solicitacao_id: int,
    service: MembroService = Depends(get_membro_service),
    _: Usuario = Depends(get_current_user),
):
    """Listar membros vinculados à versão da solicitação de RH."""
    return service.listar(solicitacao_id)


@router.put("/{solicitacao_id}/membros/{membro_id}", response_model=MembroResponse)
def atualizar_membro(
    solicitacao_id: int,
    membro_id: int,
    dados: MembroUpdate,
    service: MembroService = Depends(get_membro_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Atualizar dados de um membro.
    
    - Revalida regras de carga horária e recacula valores se necessário
    - Exclusivo para o Coordenador do Projeto
    """
    return service.atualizar(solicitacao_id, membro_id, dados, usuario_logado_id=current_user.id)


@router.delete("/{solicitacao_id}/membros/{membro_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_membro(
    solicitacao_id: int,
    membro_id: int,
    service: MembroService = Depends(get_membro_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Remover um membro da solicitação que ainda está em rascunho (Em Edição).
    
    - Exclusivo para o Coordenador do Projeto
    """
    service.remover(solicitacao_id, membro_id, usuario_logado_id=current_user.id)
    return None