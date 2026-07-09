from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.usuario_perfil import Usuario
from app.schemas.anexo import (
    AnexoListResponse,
    AnexoOrigem,
    AnexoResponse,
    AnexoUploadResponse,
)
from app.services.anexo_service import AnexoService


router = APIRouter(
    prefix="/projetos/{projeto_id}/anexos-amplos",
    tags=["Anexos"],
    dependencies=[Depends(get_current_user)],
)


def _service(db: Session = Depends(get_db)) -> AnexoService:
    return AnexoService(db)


def _to_response(anexo) -> AnexoResponse:
    return AnexoResponse(
        id=str(anexo.id),
        id_projeto=anexo.id_projeto,
        file_type=anexo.file_type,
        nome_arquivo=anexo.nome_arquivo,
        tamanho_bytes=anexo.tamanho_bytes,
        created_at=anexo.created_at,
        created_by=anexo.created_by,
        origem=anexo.origem,
    )


@router.get("", response_model=AnexoListResponse)
def listar_anexos(
    projeto_id: int,
    origem: AnexoOrigem | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: Usuario = Depends(get_current_user),
    service: AnexoService = Depends(_service),
):
    itens, total = service.listar(
        projeto_id=projeto_id,
        current_user=current_user,
        origem=origem,
        page=page,
        per_page=per_page,
    )
    pages = (total + per_page - 1) // per_page if per_page else 0
    return AnexoListResponse(
        items=[_to_response(a) for a in itens],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.post("", response_model=AnexoUploadResponse, status_code=status.HTTP_201_CREATED)
def criar_anexo(
    projeto_id: int,
    arquivo: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user),
    service: AnexoService = Depends(_service),
):
    anexo = service.criar_usuario(
        projeto_id=projeto_id,
        arquivo=arquivo,
        current_user=current_user,
    )
    return _to_response(anexo)


def _resolver_ou_404(anexo) -> Response:
    if anexo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo nao encontrado",
        )
    return Response(
        content=anexo.file_bytes,
        media_type=anexo.file_type,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{anexo.nome_arquivo}"'
            )
        },
    )


@router.get("/{anexo_id}/download")
def baixar_anexo(
    projeto_id: int,
    anexo_id: UUID,
    current_user: Usuario = Depends(get_current_user),
    service: AnexoService = Depends(_service),
):
    anexo = service.download(projeto_id, anexo_id, current_user)
    return _resolver_ou_404(anexo)


@router.get("/{anexo_id}/preview")
def preview_anexo(
    projeto_id: int,
    anexo_id: UUID,
    current_user: Usuario = Depends(get_current_user),
    service: AnexoService = Depends(_service),
):
    anexo = service.preview(projeto_id, anexo_id, current_user)
    return Response(
        content=anexo.file_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'inline; filename="{anexo.nome_arquivo}"'
            )
        },
    )


@router.delete("/{anexo_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_anexo(
    projeto_id: int,
    anexo_id: UUID,
    current_user: Usuario = Depends(get_current_user),
    service: AnexoService = Depends(_service),
):
    service.remover(projeto_id, anexo_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
