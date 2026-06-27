from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.parametro_regra import ParametroRegra
from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.projeto import Projeto
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.utils.enums import CategoriaBolsa, FonteFinanciamento, StatusVersaoRH, TipoParametroRegra

_DATA_INFINITO = date(9999, 12, 31)


def _quantize(valor: Decimal) -> Decimal:
    return valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _periodos_sobrepoem(
    a_inicio: date,
    a_fim: Optional[date],
    b_inicio: date,
    b_fim: Optional[date],
) -> bool:
    """
    Retorna True se os dois períodos se sobrepõem.

    Tratamento de `data_fim` nula: significa "em aberto" — conta como
    sobreposição com qualquer data_inicio posterior a `a_inicio`/`b_inicio`.
    """
    a_fim_eff = a_fim or _DATA_INFINITO
    b_fim_eff = b_fim or _DATA_INFINITO
    return a_inicio <= b_fim_eff and b_inicio <= a_fim_eff


class ParametroService:
    def __init__(self, db: Session):
        self.db = db

    def calcular_valor_bolsa(
        self,
        categoria: CategoriaBolsa,
        ch_semanal: int,
        data_referencia: date,
        data_fim: Optional[date] = None,
    ) -> Decimal:
        """
        Calcula o valor da bolsa.

        Retorna o valor **mensal** (proporcional à CH semanal vs CH de referência).
        O valor do período (proporcional aos dias) deve ser calculado via
        `calcular_valor_periodo` quando `data_fim` for fornecida.
        """
        param = self._buscar_parametro_vigente(
            tipo=TipoParametroRegra.VALOR_BOLSA,
            data_referencia=data_referencia,
            categoria=categoria,
        )
        if param is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Não existe parâmetro de valor de bolsa vigente para a categoria "
                    f"{categoria.value} em {data_referencia.isoformat()}."
                ),
            )
        if not param.valor_bolsa_referencia or not param.carga_horaria_referencia:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Parâmetro vigente para {categoria.value} está sem valor de "
                    "referencia ou carga horaria de referencia."
                ),
            )

        ch_referencia = Decimal(param.carga_horaria_referencia)
        valor_referencia = Decimal(param.valor_bolsa_referencia)
        ch_alocada = Decimal(ch_semanal)

        valor = (ch_alocada / ch_referencia) * valor_referencia
        return _quantize(valor)

    def calcular_valor_periodo(
        self,
        categoria: CategoriaBolsa,
        ch_semanal: int,
        data_inicio: date,
        data_fim: Optional[date] = None,
    ) -> Decimal:
        """
        Calcula o valor da bolsa proporcional ao período de participação.

        Semântica:
        - Quando `data_fim` é None: retorna o valor mensal integral.
        - Quando `data_fim` é fornecida: retorna `valor_mensal * (dias / 30)`,
          onde `dias = (data_fim - data_inicio).days + 1`.

        Levanta HTTP 400 quando `data_fim < data_inicio`.
        """
        if data_fim is not None and data_fim < data_inicio:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"data_fim ({data_fim.isoformat()}) deve ser maior ou igual a "
                    f"data_inicio ({data_inicio.isoformat()})."
                ),
            )

        valor_mensal = self.calcular_valor_bolsa(
            categoria=categoria,
            ch_semanal=ch_semanal,
            data_referencia=data_inicio,
        )

        if data_fim is None:
            return valor_mensal

        dias = (data_fim - data_inicio).days + 1
        return _quantize(valor_mensal * Decimal(dias) / Decimal(30))

    def calcular_valor_hora(
        self,
        valor_bolsa_mensal: Decimal,
        ch_semanal: int,
    ) -> Decimal:
        """Calcula o valor/hora médio a partir do valor mensal e CH semanal."""
        if ch_semanal <= 0:
            return Decimal("0.00")
        return _quantize(valor_bolsa_mensal / Decimal(ch_semanal))

    def _build_alocacao_concorrente(self, membro: PesquisadorProjeto) -> dict:
        """Monta o breakdown de uma alocação concorrente para resposta."""
        projeto = (
            self.db.query(Projeto)
            .join(VersaoRHProjeto, VersaoRHProjeto.projeto_id == Projeto.id)
            .filter(VersaoRHProjeto.id == membro.versao_rh_id)
            .first()
        )
        valor_mensal = Decimal(str(membro.valor_bolsa))
        valor_hora = self.calcular_valor_hora(valor_mensal, membro.carga_horaria_semanal)
        return {
            "projeto_id": projeto.id if projeto else None,
            "projeto_codigo": projeto.codigo if projeto else "",
            "projeto_titulo": projeto.titulo if projeto else "",
            "carga_horaria_semanal": membro.carga_horaria_semanal,
            "valor_hora_medio": float(valor_hora),
            "valor_bolsa_mensal": float(valor_mensal),
            "fonte_financiamento": membro.fonte_financiamento,
            "data_inicio": membro.data_inicio,
            "data_fim": membro.data_fim,
        }

    def validar_carga_horaria_global(
        self,
        ref_pesquisador: str,
        ch_nova: int,
        data_inicio_novo: date,
        data_fim_novo: Optional[date],
        membro_id_excluir: Optional[int] = None,
        projeto_id_excluir: Optional[int] = None,
    ) -> None:
        param = self._buscar_parametro_vigente(
            tipo=TipoParametroRegra.LIMITE_CARGA_HORARIA,
            data_referencia=data_inicio_novo,
        )
        if param is None or not param.limite_carga_horaria_semanal:
            return

        limite = param.limite_carga_horaria_semanal
        concorrentes = self._listar_concorrentes(
            ref_pesquisador=ref_pesquisador,
            data_inicio_novo=data_inicio_novo,
            data_fim_novo=data_fim_novo,
            membro_id_excluir=membro_id_excluir,
            projeto_id_excluir=projeto_id_excluir,
        )
        ch_concorrente = sum(m.carga_horaria_semanal for m in concorrentes)
        ch_total = ch_concorrente + ch_nova

        if ch_total > limite:
            detalhes = ", ".join(
                f"[{c['projeto_codigo']} — {c['carga_horaria_semanal']}h × R$ "
                f"{c['valor_hora_medio']:.2f}/h]"
                for c in (self._build_alocacao_concorrente(m) for m in concorrentes)
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Carga horária global excede o limite. Total proposto: {ch_total}h "
                    f"(limite: {limite}h). Alocações vigentes em outros projetos: "
                    f"{len(concorrentes)}. Detalhes: {detalhes}"
                ),
            )

    def obter_validacao_ch_global(
        self,
        ref_pesquisador: str,
        ch_nova: int,
        data_inicio_novo: date,
        data_fim_novo: Optional[date],
        membro_id_excluir: Optional[int] = None,
        projeto_id_excluir: Optional[int] = None,
    ) -> dict:
        """
        Versão não-throwing de validar_carga_horaria_global.
        Retorna estrutura adequada para preview no frontend.
        """
        param = self._buscar_parametro_vigente(
            tipo=TipoParametroRegra.LIMITE_CARGA_HORARIA,
            data_referencia=data_inicio_novo,
        )
        limite = param.limite_carga_horaria_semanal if param else 0

        concorrentes = self._listar_concorrentes(
            ref_pesquisador=ref_pesquisador,
            data_inicio_novo=data_inicio_novo,
            data_fim_novo=data_fim_novo,
            membro_id_excluir=membro_id_excluir,
            projeto_id_excluir=projeto_id_excluir,
        )
        ch_concorrente = sum(m.carga_horaria_semanal for m in concorrentes)
        ch_total = ch_concorrente + ch_nova
        valido = limite == 0 or ch_total <= limite

        alocacoes_concorrentes = [
            self._build_alocacao_concorrente(m) for m in concorrentes
        ]

        mensagem = None
        if not valido:
            detalhes = "; ".join(
                f"{c['projeto_codigo']} {c['carga_horaria_semanal']}h × "
                f"R$ {c['valor_hora_medio']:.2f}/h"
                for c in alocacoes_concorrentes
            )
            mensagem = (
                f"CH total ({ch_total}h) excede o limite semanal de {limite}h. "
                f"Alocações vigentes: {detalhes}"
            )

        return {
            "valido": valido,
            "ch_alocada_em_outros_projetos": ch_concorrente,
            "ch_proposta": ch_nova,
            "ch_total": ch_total,
            "limite_semanal": limite,
            "alocacoes_concorrentes": alocacoes_concorrentes,
            "mensagem": mensagem,
        }

    def _listar_concorrentes(
        self,
        ref_pesquisador: str,
        data_inicio_novo: date,
        data_fim_novo: Optional[date],
        membro_id_excluir: Optional[int],
        projeto_id_excluir: Optional[int],
    ) -> List[PesquisadorProjeto]:
        """Lista alocações vigentes em outros projetos que se sobrepõem ao novo período."""
        query = (
            self.db.query(PesquisadorProjeto)
            .join(VersaoRHProjeto, PesquisadorProjeto.versao_rh_id == VersaoRHProjeto.id)
            .filter(
                VersaoRHProjeto.status == StatusVersaoRH.VIGENTE,
                PesquisadorProjeto.ref_pesquisador == ref_pesquisador,
            )
        )
        if membro_id_excluir is not None:
            query = query.filter(PesquisadorProjeto.id != membro_id_excluir)
        if projeto_id_excluir is not None:
            query = query.filter(VersaoRHProjeto.projeto_id != projeto_id_excluir)

        candidatos = query.all()
        return [
            m for m in candidatos
            if _periodos_sobrepoem(m.data_inicio, m.data_fim, data_inicio_novo, data_fim_novo)
        ]

    def resumir_pesquisador(
        self,
        ref_pesquisador: str,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
    ) -> dict:
        """
        Visão consolidada por pesquisador: alocações vigentes que se sobrepõem
        à janela opcional (quando fornecida) + agregados.

        Janela omitida = todas as alocações vigentes.
        """
        query = (
            self.db.query(PesquisadorProjeto)
            .join(VersaoRHProjeto, PesquisadorProjeto.versao_rh_id == VersaoRHProjeto.id)
            .filter(
                VersaoRHProjeto.status == StatusVersaoRH.VIGENTE,
                PesquisadorProjeto.ref_pesquisador == ref_pesquisador,
            )
        )
        todas = query.all()

        if data_inicio is not None or data_fim is not None:
            janela_inicio = data_inicio or date.min
            janela_fim = data_fim or _DATA_INFINITO
            alocacoes = [
                m for m in todas
                if _periodos_sobrepoem(m.data_inicio, m.data_fim, janela_inicio, janela_fim)
            ]
        else:
            alocacoes = todas

        alocacoes_response = [self._build_alocacao_concorrente(m) for m in alocacoes]

        ch_total = sum(a["carga_horaria_semanal"] for a in alocacoes_response)
        custo_total = sum(
            (Decimal(str(a["valor_bolsa_mensal"])) for a in alocacoes_response),
            Decimal("0"),
        )
        valor_hora_ponderado = (
            _quantize(custo_total / Decimal(ch_total)) if ch_total > 0 else Decimal("0.00")
        )

        return {
            "ref_pesquisador": ref_pesquisador,
            "alocacoes": alocacoes_response,
            "total_projetos": len({a["projeto_id"] for a in alocacoes_response if a["projeto_id"] is not None}),
            "total_fontes": len({a["fonte_financiamento"] for a in alocacoes_response}),
            "ch_total": ch_total,
            "valor_hora_medio_ponderado": float(valor_hora_ponderado),
            "custo_total_mensal": _quantize(custo_total),
        }

    def _buscar_parametro_vigente(
        self,
        tipo: TipoParametroRegra,
        data_referencia: date,
        categoria: Optional[CategoriaBolsa] = None,
    ) -> Optional[ParametroRegra]:
        query = self.db.query(ParametroRegra).filter(
            ParametroRegra.tipo_regra == tipo,
            ParametroRegra.ativo.is_(True),
            ParametroRegra.vigencia_inicio <= data_referencia,
            or_(
                ParametroRegra.vigencia_fim.is_(None),
                ParametroRegra.vigencia_fim >= data_referencia,
            ),
        )
        if categoria is not None:
            query = query.filter(ParametroRegra.categoria_bolsa == categoria)

        return query.order_by(ParametroRegra.vigencia_inicio.desc()).first()
