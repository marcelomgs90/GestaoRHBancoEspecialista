from pydantic import BaseModel

from app.utils.enums import StatusVersaoRH


class VersaoResponse(BaseModel):
    id: int
    projeto_id: int
    numero_versao: int
    status: StatusVersaoRH

    class Config:
        from_attributes = True


class MembroComparacao(BaseModel):
    id: int
    ref_pesquisador: str
    nome_pesquisador: str
    categoria_bolsa: str
    carga_horaria_semanal: int
    valor_bolsa: float

    class Config:
        from_attributes = True


class ComparacaoResponse(BaseModel):
    antes: dict
    depois: dict
    diferencas: dict
