from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_parametro_service
from app.models.usuario_perfil import Usuario
from app.schemas.parametro import (
    CalcularBolsaRequest,
    CalcularBolsaResponse,
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
    """
    valor = service.calcular_valor_bolsa(
        categoria=dados.categoria,
        ch_semanal=dados.carga_horaria_semanal,
        data_referencia=dados.data_referencia,
    )
    return CalcularBolsaResponse(
        valor=float(valor),
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
    sem lançar exceção. Retorna estado detalhado para feedback no frontend.
    """
    resultado = service.obter_validacao_ch_global(
        ref_pesquisador=dados.ref_pesquisador,
        ch_nova=dados.carga_horaria_semanal,
        data_inicio_novo=dados.data_inicio,
        data_fim_novo=dados.data_fim,
        membro_id_excluir=dados.membro_id_excluir,
        projeto_id_excluir=dados.projeto_id_excluir,
    )
    return ValidarChGlobalResponse(**resultado)
