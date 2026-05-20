from typing import List, Optional

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_projeto_service, get_versao_service
from app.models.usuario_perfil import Usuario
from app.schemas.projeto import ProjetoCreate, ProjetoResponse
from app.schemas.versao import VersaoRHProjetoResponse
from app.services.projeto_service import ProjetoService
from app.services.versao_service import VersaoService
from app.utils.enums import StatusProjeto

router = APIRouter()


@router.post("/", response_model=ProjetoResponse, status_code=201)
def criar_projeto(
    dados: ProjetoCreate,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Criar novo projeto. O coordenador_id é atribuído ao usuário autenticado."""
    return service.criar(dados, current_user)


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


@router.get("/{projeto_id}/versoes", response_model=List[VersaoRHProjetoResponse])
def listar_versoes_projeto(
    projeto_id: int,
    projeto_service: ProjetoService = Depends(get_projeto_service),
    versao_service: VersaoService = Depends(get_versao_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Listar versoes de RH de um projeto, ordenadas pela mais recente primeiro.
    Retorna todos os campos da tabela versao_rh_projeto.
    """
    projeto_service.obter_por_id(projeto_id, current_user)
    return versao_service.listar_por_projeto(projeto_id)


@router.get("/{projeto_id}")
def obter_projeto(
    projeto_id: int,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Obter detalhes de um projeto."""
    return service.obter_por_id(projeto_id, current_user)
