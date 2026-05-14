from typing import Optional

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_projeto_service
from app.models.usuario_perfil import Usuario
from app.services.projeto_service import ProjetoService
from app.utils.enums import StatusProjeto

router = APIRouter()


@router.get("/")
def listar_projetos(
    status: Optional[StatusProjeto] = None,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Listar projetos.

    - Coordenadores veem apenas seus projetos
    - Administradores e Gestores do Polo veem todos
    """
    return service.listar(current_user, status_filtro=status)


@router.get("/{projeto_id}")
def obter_projeto(
    projeto_id: int,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Obter detalhes de um projeto."""
    return service.obter_por_id(projeto_id, current_user)
