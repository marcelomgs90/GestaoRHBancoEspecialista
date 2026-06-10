from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_especialistas_db
from app.services.especialista_service import EspecialistaService
from app.schemas.especialista import EspecialistaResponse

router = APIRouter(prefix="/especialistas", tags=["Especialistas"])

@router.get("/", response_model=List[EspecialistaResponse])
def buscar_especialistas(
    q: Optional[str] = Query(None, description="Busca por nome ou CPF"),
    db: Session = Depends(get_especialistas_db) # <--- SESSÃO EXTERNA INJETADA AQUI!
):
    """
    Endpoint refatorado para usar o EspecialistaService com a estrutura real do banco.
    """
    service = EspecialistaService(db)
    return service.buscar_especialistas(termo=q)