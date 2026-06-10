from pydantic import BaseModel

class EspecialistaResponse(BaseModel):
    """Schema para retorno de especialistas do banco externo."""
    id: int
    nome: str
    matricula: str

    class Config:
        from_attributes = True