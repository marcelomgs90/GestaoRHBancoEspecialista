from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.parametro_regra import ParametroRegra
from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.utils.enums import CategoriaBolsa, StatusVersaoRH, TipoParametroRegra

_DATA_INFINITO = date(9999, 12, 31)


class ParametroService:
    def __init__(self, db: Session):
        self.db = db

    def calcular_valor_bolsa(
        self,
        categoria: CategoriaBolsa,
        ch_semanal: int,
        data_referencia: date,
    ) -> Decimal:
        param = self._buscar_parametro_vigente(
            tipo=TipoParametroRegra.VALOR_BOLSA,
            data_referencia=data_referencia,
            categoria=categoria,
        )
        if param is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Nao existe parametro de valor de bolsa vigente para a categoria "
                    f"{categoria.value} em {data_referencia.isoformat()}."
                ),
            )
        if not param.valor_bolsa_referencia or not param.carga_horaria_referencia:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Parametro vigente para {categoria.value} esta sem valor de "
                    "referencia ou carga horaria de referencia."
                ),
            )

        ch_referencia = Decimal(param.carga_horaria_referencia)
        valor_referencia = Decimal(param.valor_bolsa_referencia)
        ch_alocada = Decimal(ch_semanal)

        valor = (ch_alocada / ch_referencia) * valor_referencia
        return valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

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
        fim_novo = data_fim_novo or _DATA_INFINITO

        query = (
            self.db.query(PesquisadorProjeto)
            .join(VersaoRHProjeto, PesquisadorProjeto.versao_rh_id == VersaoRHProjeto.id)
            .filter(
                VersaoRHProjeto.status == StatusVersaoRH.VIGENTE,
                PesquisadorProjeto.ref_pesquisador == ref_pesquisador,
                PesquisadorProjeto.data_inicio <= fim_novo,
                or_(
                    PesquisadorProjeto.data_fim.is_(None),
                    PesquisadorProjeto.data_fim >= data_inicio_novo,
                ),
            )
        )
        if membro_id_excluir is not None:
            query = query.filter(PesquisadorProjeto.id != membro_id_excluir)
        if projeto_id_excluir is not None:
            query = query.filter(VersaoRHProjeto.projeto_id != projeto_id_excluir)

        ch_concorrente = sum(m.carga_horaria_semanal for m in query.all())
        ch_total = ch_concorrente + ch_nova

        if ch_total > limite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Carga horaria global excede o limite. O pesquisador ja possui "
                    f"{ch_concorrente}h alocadas em vinculos concorrentes; somando "
                    f"{ch_nova}h o total seria {ch_total}h (limite: {limite}h)."
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
        Versao nao-throwing de validar_carga_horaria_global.
        Retorna estrutura adequada para preview no frontend.
        """
        param = self._buscar_parametro_vigente(
            tipo=TipoParametroRegra.LIMITE_CARGA_HORARIA,
            data_referencia=data_inicio_novo,
        )
        limite = param.limite_carga_horaria_semanal if param else 0
        fim_novo = data_fim_novo or _DATA_INFINITO

        query = (
            self.db.query(PesquisadorProjeto)
            .join(VersaoRHProjeto, PesquisadorProjeto.versao_rh_id == VersaoRHProjeto.id)
            .filter(
                VersaoRHProjeto.status == StatusVersaoRH.VIGENTE,
                PesquisadorProjeto.ref_pesquisador == ref_pesquisador,
                PesquisadorProjeto.data_inicio <= fim_novo,
                or_(
                    PesquisadorProjeto.data_fim.is_(None),
                    PesquisadorProjeto.data_fim >= data_inicio_novo,
                ),
            )
        )
        if membro_id_excluir is not None:
            query = query.filter(PesquisadorProjeto.id != membro_id_excluir)
        if projeto_id_excluir is not None:
            query = query.filter(VersaoRHProjeto.projeto_id != projeto_id_excluir)

        ch_concorrente = sum(m.carga_horaria_semanal for m in query.all())
        ch_total = ch_concorrente + ch_nova
        valido = limite == 0 or ch_total <= limite

        return {
            "valido": valido,
            "ch_alocada_em_outros_projetos": ch_concorrente,
            "ch_proposta": ch_nova,
            "ch_total": ch_total,
            "limite_semanal": limite,
            "mensagem": None
            if valido
            else f"CH total ({ch_total}h) excede o limite semanal de {limite}h.",
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
