from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.models.usuario_perfil import Usuario
from app.schemas.auth import UsuarioResponse
from app.utils.enums import PerfilUsuario

router = APIRouter()


@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(PerfilUsuario.ADMINISTRADOR))
):
    """Listar todos os usuarios (apenas admin)."""
    return db.query(Usuario).all()


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obter_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(PerfilUsuario.ADMINISTRADOR))
):
    """Obter usuario por ID (apenas admin)."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario nao encontrado"
        )

    return usuario
