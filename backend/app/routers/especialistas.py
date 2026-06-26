from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_especialistas_db,
)
from app.models.usuario_perfil import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.especialista import EspecialistaResponse, PesquisadorResponse
from app.services.especialista_service import EspecialistaService

router = APIRouter(prefix="/especialistas", tags=["Especialistas"])


@router.get("/", response_model=List[EspecialistaResponse])
def buscar_especialistas(
    q: Optional[str] = Query(None, description="Busca por nome ou CPF"),
    db: Session = Depends(get_especialistas_db),  # <--- SESSÃO EXTERNA INJETADA AQUI!
):
    """
    Endpoint refatorado para usar o EspecialistaService com a estrutura real do banco.
    """
    service = EspecialistaService(db)
    return service.buscar_especialistas(termo=q)


@router.get(
    "/pesquisadores/",
    response_model=PaginatedResponse[PesquisadorResponse],
)
def listar_pesquisadores(
    tipo: Optional[str] = Query(
        None,
        description=(
            "Filtra por tipo de especialista (ex.: 'Servidor'). "
            "Aplica ILIKE sobre users_specialist_types.name."
        ),
    ),
    q: Optional[str] = Query(
        None,
        description="Busca por nome ou CPF/matricula",
    ),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_especialistas_db),
    _current_user: Usuario = Depends(get_current_user),
):
    """
    Lista pesquisadores do Banco Especialista com paginacao.

    Requer autenticacao. Quando `tipo` e informado, retorna apenas
    pesquisadores cujo tipo (em `users_specialist_types.name`) case com
    o valor via ILIKE. INNER JOIN entre `users` e `users_specialist_types`.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Banco de Especialistas indisponivel",
        )

    service = EspecialistaService(db)
    items, total = service.listar_pesquisadores(
        tipo=tipo,
        termo=q,
        page=page,
        per_page=per_page,
    )
    pages = (total + per_page - 1) // per_page if per_page else 0
    return PaginatedResponse[PesquisadorResponse](
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )