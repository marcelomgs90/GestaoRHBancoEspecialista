from typing import List

from fastapi import APIRouter, Depends

from app.core.dependencies import get_usuario_service
from app.core.permissions import require_role
from app.models.usuario_perfil import Usuario
from app.schemas.auth import UsuarioResponse
from app.services.usuario_service import UsuarioService
from app.utils.enums import PerfilUsuario

router = APIRouter()


@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(
    service: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_role(PerfilUsuario.ADMINISTRADOR)),
):
    """Listar todos os usuarios (apenas admin)."""
    return service.listar()


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obter_usuario(
    usuario_id: int,
    service: UsuarioService = Depends(get_usuario_service),
    _: Usuario = Depends(require_role(PerfilUsuario.ADMINISTRADOR)),
):
    """Obter usuario por ID (apenas admin)."""
    return service.obter_por_id(usuario_id)
