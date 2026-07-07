from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_usuario_service
from app.core.permissions import require_role
from app.models.usuario_perfil import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.auth import UsuarioResponse
from app.services.usuario_service import UsuarioService
from app.utils.enums import PerfilUsuario

router = APIRouter()


@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(
    service: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_role(PerfilUsuario.ADMINISTRADOR)),
):
    """Listar todos os usuários (apenas admin)."""
    return service.listar()


@router.get("/coordenadores", response_model=PaginatedResponse[UsuarioResponse])
def listar_coordenadores(
    q: Optional[str] = Query(None, description="Busca por nome, email ou referencia"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    service: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(
        require_role(
            PerfilUsuario.ADMINISTRADOR,
            PerfilUsuario.GESTOR_POLO,
            PerfilUsuario.COORDENADOR,
        )
    ),
):
    """Listar coordenadores internos ativos do gestao_rh_db."""
    items, total = service.listar_coordenadores(q, page=page, per_page=per_page)
    pages = (total + per_page - 1) // per_page if per_page else 0
    return PaginatedResponse[UsuarioResponse](
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obter_usuario(
    usuario_id: int,
    service: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_role(PerfilUsuario.ADMINISTRADOR)),
):
    """Obter usuário por ID (apenas admin)."""
    return service.obter_por_id(usuario_id)
