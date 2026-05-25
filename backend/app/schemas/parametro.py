from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.utils.enums import CategoriaBolsa


class CalcularBolsaRequest(BaseModel):
    categoria: CategoriaBolsa
    carga_horaria_semanal: int = Field(..., gt=0, le=80)
    data_referencia: date


class CalcularBolsaResponse(BaseModel):
    valor: float
    categoria: CategoriaBolsa
    carga_horaria_semanal: int


class ValidarChGlobalRequest(BaseModel):
    ref_pesquisador: str
    carga_horaria_semanal: int = Field(..., gt=0, le=80)
    data_inicio: date
    data_fim: Optional[date] = None
    membro_id_excluir: Optional[int] = None
    projeto_id_excluir: Optional[int] = None


class ValidarChGlobalResponse(BaseModel):
    """
    Resposta da validacao de CH global.
    valido=True quando o vinculo proposto cabe no limite semanal.
    """
    valido: bool
    ch_alocada_em_outros_projetos: int
    ch_proposta: int
    ch_total: int
    limite_semanal: int
    mensagem: Optional[str] = None
