from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.responses import FileResponse, Response

from app.core.dependencies import get_current_user, get_projeto_service, get_versao_service
from app.models.usuario_perfil import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.membro import MembroResponse
from app.schemas.projeto import (
    ProjetoAnexoResponse,
    ProjetoCreate,
    ProjetoResponse,
    ProjetoUpdate,
)
from app.schemas.versao import VersaoRHProjetoResponse
from app.services.projeto_service import ProjetoService
from app.services.versao_service import VersaoService
from app.utils.enums import StatusProjeto, TipoDocumentoProjeto

router = APIRouter()


@router.post("/", response_model=ProjetoResponse, status_code=201)
def criar_projeto(
    dados: ProjetoCreate,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Criar novo projeto. O coordenador_id é atribuído ao usuário autenticado."""
    return service.criar(dados, current_user)


@router.get("/", response_model=List[ProjetoResponse])
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


@router.put("/{projeto_id}", response_model=ProjetoResponse)
def atualizar_projeto(
    projeto_id: int,
    dados: ProjetoUpdate,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualizar dados cadastrais do projeto sem alterar codigo, coordenador ou fontes."""
    return service.atualizar(projeto_id, dados, current_user)


@router.get("/{projeto_id}/anexos", response_model=List[ProjetoAnexoResponse])
def listar_anexos_projeto(
    projeto_id: int,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Listar documentos anexados ao projeto."""
    return service.listar_anexos(projeto_id, current_user)


@router.post("/{projeto_id}/anexos", response_model=ProjetoAnexoResponse, status_code=201)
def enviar_anexo_projeto(
    projeto_id: int,
    tipo_documento: TipoDocumentoProjeto = Form(...),
    numero_documento: Optional[str] = Form(None),
    arquivo: UploadFile = File(...),
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Enviar ou substituir um documento anexado ao projeto."""
    return service.salvar_anexo(
        projeto_id,
        tipo_documento,
        arquivo,
        current_user,
        numero_documento=numero_documento,
    )


@router.get("/{projeto_id}/anexos/{anexo_id}/download")
def baixar_anexo_projeto(
    projeto_id: int,
    anexo_id: int,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Baixar documento anexado ao projeto."""
    anexo = service.obter_anexo(projeto_id, anexo_id, current_user)
    caminho = service.caminho_absoluto_anexo(anexo)
    if not caminho.exists() or not caminho.is_file():
        return Response(status_code=status.HTTP_404_NOT_FOUND)
    return FileResponse(
        caminho,
        media_type=anexo.content_type or "application/octet-stream",
        filename=anexo.nome_arquivo_original,
    )


@router.delete("/{projeto_id}/anexos/{anexo_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_anexo_projeto(
    projeto_id: int,
    anexo_id: int,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Remover documento anexado ao projeto."""
    service.remover_anexo(projeto_id, anexo_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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


@router.get("/{projeto_id}", response_model=ProjetoResponse)
def obter_projeto(
    projeto_id: int,
    service: ProjetoService = Depends(get_projeto_service),
    current_user: Usuario = Depends(get_current_user),
):
    """Obter detalhes de um projeto."""
    return service.obter_por_id(projeto_id, current_user)
