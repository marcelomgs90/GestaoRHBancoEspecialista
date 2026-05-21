from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.utils.enums import StatusProjeto


class ProjetoCreate(BaseModel):
    codigo: str
    titulo: str
    descricao: Optional[str] = None
    data_inicio: date
    data_fim: date
    status: StatusProjeto = StatusProjeto.ATIVO


class ProjetoResponse(BaseModel):
    id: int
    codigo: str
    titulo: str
    descricao: Optional[str]
    data_inicio: date
    data_fim: date
    status: StatusProjeto
    coordenador_id: int
    criado_em: datetime
    atualizado_em: datetime

    class Config:
        from_attributes = True
