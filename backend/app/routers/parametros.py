from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user, get_parametro_service
from app.models.usuario_perfil import Usuario
from app.schemas.parametro import (
    AlocacaoConcorrenteResponse,
    CalcularBolsaRequest,
    CalcularBolsaResponse,
    ResumoPesquisadorResponse,
    ValidarChGlobalRequest,
    ValidarChGlobalResponse,
)
from app.services.parametro_service import ParametroService

router = APIRouter()


@router.post("/calcular-bolsa", response_model=CalcularBolsaResponse)
def calcular_bolsa(
    dados: CalcularBolsaRequest,
    service: ParametroService = Depends(get_parametro_service),
    _: Usuario = Depends(get_current_user),
):
    """
    Calcula o valor proporcional da bolsa para preview no frontend.
    Usado para feedback em tempo real durante a edição de membros (US-SD-03).

    Quando `data_fim` é fornecida, o response inclui `valor_periodo`
    proporcional aos dias no período, além do `valor_mensal` integral
    e do `valor_hora` médio.
    """
    valor_mensal = service.calcular_valor_bolsa(
        categoria=dados.categoria,
        ch_semanal=dados.carga_horaria_semanal,
        data_referencia=dados.data_referencia,
    )
    valor_periodo = service.calcular_valor_periodo(
        categoria=dados.categoria,
        ch_semanal=dados.carga_horaria_semanal,
        data_inicio=dados.data_referencia,
        data_fim=dados.data_fim,
    )
    valor_hora = service.calcular_valor_hora(
        valor_bolsa_mensal=valor_mensal,
        ch_semanal=dados.carga_horaria_semanal,
    )
    return CalcularBolsaResponse(
        valor=float(valor_mensal),
        valor_mensal=float(valor_mensal),
        valor_periodo=float(valor_periodo),
        valor_hora=float(valor_hora),
        categoria=dados.categoria,
        carga_horaria_semanal=dados.carga_horaria_semanal,
    )


@router.post("/validar-ch-global", response_model=ValidarChGlobalResponse)
def validar_ch_global(
    dados: ValidarChGlobalRequest,
    service: ParametroService = Depends(get_parametro_service),
    _: Usuario = Depends(get_current_user),
):
    """
    Valida se um vínculo proposto cabe no limite semanal global do pesquisador
    sem lançar exceção. Retorna estado detalhado para feedback no frontend,
    incluindo `alocacoes_concorrentes` (projeto, CH e valor/hora de cada
    alocação vigente em outro projeto que compõe o total).
    """
    resultado = service.obter_validacao_ch_global(
        ref_pesquisador=dados.ref_pesquisador,
        ch_nova=dados.carga_horaria_semanal,
        data_inicio_novo=dados.data_inicio,
        data_fim_novo=dados.data_fim,
        membro_id_excluir=dados.membro_id_excluir,
        projeto_id_excluir=dados.projeto_id_excluir,
    )
    alocacoes = [
        AlocacaoConcorrenteResponse(**a) for a in resultado.pop("alocacoes_concorrentes", [])
    ]
    return ValidarChGlobalResponse(
        **resultado,
        alocacoes_concorrentes=alocacoes,
    )


@router.get("/resumo-pesquisador", response_model=ResumoPesquisadorResponse)
def resumo_pesquisador(
    ref_pesquisador: str = Query(..., min_length=1),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    service: ParametroService = Depends(get_parametro_service),
    _: Usuario = Depends(get_current_user),
):
    """
    Visão consolidada por pesquisador: alocações vigentes (opcionalmente
    filtradas por uma janela) + agregados (`total_projetos`, `total_fontes`,
    `ch_total`, `valor_hora_medio_ponderado`, `custo_total_mensal`).
    """
    resultado = service.resumir_pesquisador(
        ref_pesquisador=ref_pesquisador,
        data_inicio=data_inicio,
        data_fim=data_fim,
    )
    alocacoes = [
        AlocacaoConcorrenteResponse(**a) for a in resultado.pop("alocacoes", [])
    ]
    return ResumoPesquisadorResponse(
        **resultado,
        alocacoes=alocacoes,
    )
