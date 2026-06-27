"""
Builder compartilhado para `MembroResponse`.

Centraliza a derivação dos campos calculados (`valor_bolsa_mensal`,
`valor_bolsa_periodo`, `valor_hora_medio`) a partir do ORM `PesquisadorProjeto`.

Usado por `MembroService` e `VersaoService` para garantir que todo response
serializado contenha os três campos derivados — sem isso, Pydantic falha
a validação e o FastAPI retorna 500.
"""
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.pesquisador_projeto import PesquisadorProjeto
from app.schemas.membro import MembroResponse
from app.services.parametro_service import ParametroService


def build_membro_response(membro: PesquisadorProjeto, db: Session) -> MembroResponse:
    """
    Constrói `MembroResponse` a partir de um `PesquisadorProjeto`, calculando
    os três campos derivados:

    - `valor_bolsa_mensal` = `valor_bolsa` (o persistido é o mensal integral,
      proporcional à CH semanal vs CH de referência).
    - `valor_bolsa_periodo` = `valor_mensal * dias_no_periodo / 30` quando há
      `data_fim`; caso contrário, igual ao mensal.
    - `valor_hora_medio` = `valor_mensal / carga_horaria_semanal`.

    Esses campos são derivados — não há colunas persistidas para eles. O cálculo
    é feito no momento da serialização para refletir o `ParametroRegra` vigente
    na `data_inicio` do membro.
    """
    parametros = ParametroService(db)
    valor_mensal = Decimal(str(membro.valor_bolsa))
    valor_periodo = parametros.calcular_valor_periodo(
        categoria=membro.categoria_bolsa,
        ch_semanal=membro.carga_horaria_semanal,
        data_inicio=membro.data_inicio,
        data_fim=membro.data_fim,
    )
    valor_hora = parametros.calcular_valor_hora(
        valor_bolsa_mensal=valor_mensal,
        ch_semanal=membro.carga_horaria_semanal,
    )
    return MembroResponse(
        id=membro.id,
        ref_pesquisador=membro.ref_pesquisador,
        nome_pesquisador=membro.nome_pesquisador,
        categoria_bolsa=membro.categoria_bolsa,
        fonte_financiamento=membro.fonte_financiamento,
        carga_horaria_semanal=membro.carga_horaria_semanal,
        valor_bolsa=valor_mensal,
        valor_bolsa_mensal=valor_mensal,
        valor_bolsa_periodo=valor_periodo,
        valor_hora_medio=valor_hora,
        data_inicio=membro.data_inicio,
        data_fim=membro.data_fim,
        origem_rh=membro.origem_rh,
    )
