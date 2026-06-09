from typing import List, Optional

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_projeto_service, get_versao_service
from app.models.usuario_perfil import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.membro import MembroResponse
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


@router.get(
    "/{projeto_id}/pesquisadores",
    response_model=PaginatedResponse[MembroResponse],
)
def listar_pesquisadores_projeto(
    projeto_id: int,
    page: int = 1,
    per_page: int = 20,
    projeto_service: ProjetoService = Depends(get_projeto_service),
    versao_service: VersaoService = Depends(get_versao_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Listagem paginada de pesquisadores do projeto (versão corrente).
    Se houver solicitação EM_EDICAO, retorna versão PROPOSTA.
    Caso contrário, retorna versão VIGENTE.
    """
    projeto_service.obter_por_id(projeto_id, current_user)
    itens, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto_id, page=page, per_page=per_page
    )
    pages = (total + per_page - 1) // per_page if per_page else 0
    return PaginatedResponse[MembroResponse](
        items=itens,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        is_rascunho=is_rascunho,
    )


@router.get(
    "/{projeto_id}/pesquisadores/vigentes",
    response_model=PaginatedResponse[MembroResponse],
)
def listar_pesquisadores_vigentes_projeto(
    projeto_id: int,
    page: int = 1,
    per_page: int = 20,
    projeto_service: ProjetoService = Depends(get_projeto_service),
    versao_service: VersaoService = Depends(get_versao_service),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Listagem paginada de pesquisadores da versão VIGENTE do projeto,
    ignorando qualquer PROPOSTA em rascunho/pendente.

    Usado por telas que precisam do "antes" real (ex.: AlteracaoPage).
    """
    projeto_service.obter_por_id(projeto_id, current_user)
    itens, total = versao_service.listar_pesquisadores_vigentes(
        projeto_id, page=page, per_page=per_page
    )
    pages = (total + per_page - 1) // per_page if per_page else 0
    return PaginatedResponse[MembroResponse](
        items=itens,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        is_rascunho=False,
    )


@router.get("/{projeto_id}")
def obter_projeto(
    projeto_id: int,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Obter detalhes de um projeto."""
    return service.obter_por_id(projeto_id, current_user)
