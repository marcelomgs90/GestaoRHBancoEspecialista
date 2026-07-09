from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.common import PaginatedResponse


class AnexoOrigem(str, Enum):
    USUARIO = "USUARIO"
    SISTEMA = "SISTEMA"


class AnexoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_projeto: int
    file_type: str
    nome_arquivo: str
    tamanho_bytes: int
    origem: AnexoOrigem
    created_by: Optional[int] = None
    created_at: datetime


class AnexoResponse(AnexoBase):
    id: str


class AnexoListResponse(PaginatedResponse[AnexoResponse]):
    pass


class AnexoUploadResponse(AnexoResponse):
    pass
