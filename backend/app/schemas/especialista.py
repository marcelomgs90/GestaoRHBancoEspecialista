from typing import Optional

from pydantic import BaseModel


class EspecialistaResponse(BaseModel):
    """Schema para retorno de especialistas do banco externo."""
    id: int
    nome: str
    matricula: str
    email: Optional[str] = None

    class Config:
        from_attributes = True


class PesquisadorResponse(BaseModel):
    """Schema para retorno de pesquisadores do Banco Especialista.

    O campo `tipo_vinculo` e opcional porque o schema externo pode nao
    ter a coluna populada para todos os registros (compatibilidade).
    """
    id: int
    nome: str
    matricula: str
    email: Optional[str] = None
    tipo_vinculo: Optional[str] = None

    class Config:
        from_attributes = True
