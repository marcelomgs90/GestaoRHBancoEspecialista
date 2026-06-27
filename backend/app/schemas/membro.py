from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.utils.enums import CategoriaBolsa, FonteFinanciamento


class MembroCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ref_pesquisador: str
    nome_pesquisador: str
    categoria_bolsa: CategoriaBolsa
    fonte_financiamento: FonteFinanciamento
    carga_horaria_semanal: int
    data_inicio: date
    data_fim: Optional[date] = None
    origem_rh: Optional[str] = None


class MembroUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    categoria_bolsa: Optional[CategoriaBolsa] = None
    fonte_financiamento: Optional[FonteFinanciamento] = None
    carga_horaria_semanal: Optional[int] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None


class MembroResponse(BaseModel):
    """
    Response de membro com campos derivados.

    `valor_bolsa` é mantido por compatibilidade como sinônimo de `valor_bolsa_mensal`.
    `valor_bolsa_mensal` é o valor integral mensal (proporcional à CH semanal).
    `valor_bolsa_periodo` é o valor proporcional aos dias de participação (data_inicio → data_fim).
    `valor_hora_medio` é `valor_bolsa_mensal / carga_horaria_semanal`.

    Estes campos são calculados pelo `MembroService._build_response` no momento
    da serialização — não há colunas persistidas para eles.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    ref_pesquisador: str
    nome_pesquisador: str
    categoria_bolsa: CategoriaBolsa
    fonte_financiamento: FonteFinanciamento
    carga_horaria_semanal: int
    valor_bolsa: Decimal
    valor_bolsa_mensal: Decimal
    valor_bolsa_periodo: Decimal
    valor_hora_medio: Decimal
    data_inicio: date
    data_fim: Optional[date]
    origem_rh: Optional[str]
