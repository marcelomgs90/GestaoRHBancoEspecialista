from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db, get_current_user
from app.models.usuario_perfil import Usuario
from app.models.projeto import Projeto
from app.utils.enums import StatusProjeto

router = APIRouter()


@router.get("/")
def listar_projetos(
    status: Optional[StatusProjeto] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Listar projetos.

    - Coordenadores veem apenas seus projetos
    - Administradores e Gestores do Polo veem todos
    """
    query = db.query(Projeto)

    # Filtrar por perfil
    if current_user.perfil.value == "COORDENADOR":
        query = query.filter(Projeto.coordenador_id == current_user.id)
    elif current_user.perfil.value == "APOIO_COORDENADOR":
        # Apoio ve projetos do coordenador que ele apoia
        # Por enquanto, lista todos (ajustar conforme regra de negocio)
        pass

    # Filtrar por status
    if status:
        query = query.filter(Projeto.status == status)

    return query.all()


@router.get("/{projeto_id}")
def obter_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obter detalhes de um projeto."""
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()

    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto nao encontrado"
        )

    # Verificar permissao
    if current_user.perfil.value == "COORDENADOR":
        if projeto.coordenador_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado a este projeto"
            )

    return projeto
