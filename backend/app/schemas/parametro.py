from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from app.utils.enums import CategoriaBolsa, FonteFinanciamento


class CalcularBolsaRequest(BaseModel):
    categoria: CategoriaBolsa
    carga_horaria_semanal: int = Field(..., gt=0, le=80)
    data_referencia: date
    data_fim: Optional[date] = None


class CalcularBolsaResponse(BaseModel):
    """
    Resposta do cálculo de bolsa.

    - `valor` é mantido por compatibilidade como sinônimo de `valor_mensal`.
    - `valor_mensal` é o valor integral mensal (proporcional à CH semanal).
    - `valor_periodo` é o valor proporcional aos dias no período
      (data_inicio → data_fim). Quando `data_fim` é omitido, é igual a `valor_mensal`.
    - `valor_hora` é `valor_mensal / carga_horaria_semanal`.
    """

    valor: float
    valor_mensal: float
    valor_periodo: float
    valor_hora: float
    categoria: CategoriaBolsa
    carga_horaria_semanal: int


class AlocacaoConcorrenteResponse(BaseModel):
    """Detalhe de uma alocação vigente concorrente em outro projeto."""

    projeto_id: int
    projeto_codigo: str
    projeto_titulo: str
    carga_horaria_semanal: int
    valor_hora_medio: float
    valor_bolsa_mensal: float
    fonte_financiamento: FonteFinanciamento
    data_inicio: date
    data_fim: Optional[date]


class ValidarChGlobalRequest(BaseModel):
    ref_pesquisador: str
    carga_horaria_semanal: int = Field(..., gt=0, le=80)
    data_inicio: date
    data_fim: Optional[date] = None
    membro_id_excluir: Optional[int] = None
    projeto_id_excluir: Optional[int] = None


class ValidarChGlobalResponse(BaseModel):
    """
    Resposta da validação de CH global.
    valido=True quando o vínculo proposto cabe no limite semanal.

    `alocacoes_concorrentes` lista cada alocação vigente em outro projeto
    que compõe a CH total (sempre presente, vazia quando não há concorrentes).
    """

    valido: bool
    ch_alocada_em_outros_projetos: int
    ch_proposta: int
    ch_total: int
    limite_semanal: int
    alocacoes_concorrentes: list[AlocacaoConcorrenteResponse] = []
    mensagem: Optional[str] = None


class ResumoPesquisadorResponse(BaseModel):
    """Visão consolidada por pesquisador: alocações vigentes + agregados."""

    ref_pesquisador: str
    alocacoes: list[AlocacaoConcorrenteResponse]
    total_projetos: int
    total_fontes: int
    ch_total: int
    valor_hora_medio_ponderado: float
    custo_total_mensal: Decimal
