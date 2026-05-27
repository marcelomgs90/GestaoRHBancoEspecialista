from typing import List

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_versao_service
from app.models.usuario_perfil import Usuario
from app.schemas.versao import ComparacaoResponse, VersaoResponse
from app.services.versao_service import VersaoService

router = APIRouter()


@router.get("/{solicitacao_id}/versoes", response_model=List[VersaoResponse])
def listar_versoes(
    solicitacao_id: int,
    service: VersaoService = Depends(get_versao_service),
    _: Usuario = Depends(get_current_user),
):
    """Listar todas as versões de RH relacionadas à solicitação."""
    return service.listar(solicitacao_id)


@router.get("/{solicitacao_id}/comparacao", response_model=ComparacaoResponse)
def comparar_versoes(
    solicitacao_id: int,
    service: VersaoService = Depends(get_versao_service),
    _: Usuario = Depends(get_current_user),
):
    """
    Comparar equipe atual (antes) vs proposta (depois).

    Retorna membros agrupados por fonte de financiamento e
    lista de diferenças (inclusões, alterações, encerramentos).
    """
    return service.comparar(solicitacao_id)
