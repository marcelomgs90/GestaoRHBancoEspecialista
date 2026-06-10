"""
Router movido para a pasta correta de roteamento conforme a estrutura do projeto.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.especialista_service import EspecialistaService
from app.schemas.especialista import EspecialistaResponse

router = APIRouter(prefix="/especialistas", tags=["Especialistas"])

@router.get("/", response_model=List[EspecialistaResponse])
def listar_especialistas(
    q: Optional[str] = Query(None, description="Busca por nome ou CPF"),
    db: Session = Depends(get_db)
):
    """
    Retorna a lista de especialistas do banco externo.
    Permite filtrar por nome (full_name) ou matrícula (cpf) usando o parâmetro 'q'.
    """
    service = EspecialistaService(db)
    return service.buscar_especialistas(termo=q)