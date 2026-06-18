from decimal import Decimal
from typing import List, Union

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.projeto import Projeto
from app.models.projeto_fonte_financiamento import ProjetoFonteFinanciamento
from app.models.solicitacao_rh import SolicitacaoRH
from app.models.usuario_perfil import Usuario
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.schemas.membro import MembroCreate, MembroUpdate
from app.services.parametro_service import ParametroService
from app.utils.enums import PerfilUsuario, StatusSolicitacao


class MembroService:
    def __init__(self, db: Session):
        self.db = db
        self.parametros = ParametroService(db)

    def incluir(
        self, solicitacao_id: int, dados: MembroCreate, current_user: Union[Usuario, int]
    ) -> PesquisadorProjeto:
        solicitacao = self._buscar_solicitacao_editavel(solicitacao_id, current_user)
        versao = self._buscar_versao(solicitacao.id)
        self._validar_data_inicio_no_periodo_do_projeto(
            solicitacao.projeto_id,
            dados.data_inicio,
        )

        existente = (
            self.db.query(PesquisadorProjeto)
            .filter(
                PesquisadorProjeto.versao_rh_id == versao.id,
                PesquisadorProjeto.ref_pesquisador == dados.ref_pesquisador,
            )
            .first()
        )
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"O pesquisador {dados.nome_pesquisador} ja esta incluido nesta versao",
            )

        self.parametros.validar_carga_horaria_global(
            ref_pesquisador=dados.ref_pesquisador,
            ch_nova=dados.carga_horaria_semanal,
            data_inicio_novo=dados.data_inicio,
            data_fim_novo=dados.data_fim,
            projeto_id_excluir=solicitacao.projeto_id,
        )
        valor_bolsa = self.parametros.calcular_valor_bolsa(
            categoria=dados.categoria_bolsa,
            ch_semanal=dados.carga_horaria_semanal,
            data_referencia=dados.data_inicio,
        )
        self._validar_orcamento_fontes(
            projeto_id=solicitacao.projeto_id,
            versao_id=versao.id,
            valor_membro=valor_bolsa,
            fonte_membro=dados.fonte_financiamento,
        )

        membro = PesquisadorProjeto(
            ref_pesquisador=dados.ref_pesquisador,
            nome_pesquisador=dados.nome_pesquisador,
            versao_rh_id=versao.id,
            categoria_bolsa=dados.categoria_bolsa,
            fonte_financiamento=dados.fonte_financiamento,
            carga_horaria_semanal=dados.carga_horaria_semanal,
            valor_bolsa=valor_bolsa,
            data_inicio=dados.data_inicio,
            data_fim=dados.data_fim,
            origem_rh=dados.origem_rh,
        )
        self.db.add(membro)
        self.db.commit()
        self.db.refresh(membro)
        return membro

    def listar(self, solicitacao_id: int) -> List[PesquisadorProjeto]:
        versao = (
            self.db.query(VersaoRHProjeto)
            .filter(VersaoRHProjeto.solicitacao_id == solicitacao_id)
            .first()
        )
        if not versao:
            return []

        return (
            self.db.query(PesquisadorProjeto)
            .filter(PesquisadorProjeto.versao_rh_id == versao.id)
            .all()
        )

    def atualizar(
        self,
        solicitacao_id: int,
        membro_id: int,
        dados: MembroUpdate,
        current_user: Union[Usuario, int],
    ) -> PesquisadorProjeto:
        solicitacao = self._buscar_solicitacao_editavel(solicitacao_id, current_user)
        membro = self._buscar_membro_da_solicitacao(solicitacao_id, membro_id)

        campos_alterados = dados.model_dump(exclude_unset=True)
        for field, value in campos_alterados.items():
            setattr(membro, field, value)

        if "data_inicio" in campos_alterados:
            self._validar_data_inicio_no_periodo_do_projeto(
                solicitacao.projeto_id,
                membro.data_inicio,
            )

        if campos_alterados.keys() & {"carga_horaria_semanal", "data_inicio", "data_fim"}:
            self.parametros.validar_carga_horaria_global(
                ref_pesquisador=membro.ref_pesquisador,
                ch_nova=membro.carga_horaria_semanal,
                data_inicio_novo=membro.data_inicio,
                data_fim_novo=membro.data_fim,
                membro_id_excluir=membro.id,
                projeto_id_excluir=solicitacao.projeto_id,
            )

        if campos_alterados.keys() & {"carga_horaria_semanal", "categoria_bolsa", "data_inicio"}:
            membro.valor_bolsa = self.parametros.calcular_valor_bolsa(
                categoria=membro.categoria_bolsa,
                ch_semanal=membro.carga_horaria_semanal,
                data_referencia=membro.data_inicio,
            )

        self._validar_orcamento_fontes(
            projeto_id=solicitacao.projeto_id,
            versao_id=membro.versao_rh_id,
            valor_membro=membro.valor_bolsa,
            fonte_membro=membro.fonte_financiamento,
            membro_id=membro.id,
        )

        self.db.commit()
        self.db.refresh(membro)
        return membro

    def remover(self, solicitacao_id: int, membro_id: int, current_user: Union[Usuario, int]) -> None:
        self._buscar_solicitacao_editavel(solicitacao_id, current_user)
        membro = self._buscar_membro_da_solicitacao(solicitacao_id, membro_id)

        self.db.delete(membro)
        self.db.commit()

    def _buscar_solicitacao_editavel(
        self, solicitacao_id: int, current_user: Union[Usuario, int]
    ) -> SolicitacaoRH:
        current_user = self._normalizar_usuario(current_user)

        solicitacao = (
            self.db.query(SolicitacaoRH)
            .filter(SolicitacaoRH.id == solicitacao_id)
            .first()
        )
        if not solicitacao:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitacao nao encontrada",
            )

        if solicitacao.status != StatusSolicitacao.EM_EDICAO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solicitacao nao esta em edicao",
            )

        projeto = self.db.query(Projeto).filter(Projeto.id == solicitacao.projeto_id).first()
        if not projeto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto nao encontrado",
            )

        pode_editar = (
            current_user.perfil in (
                PerfilUsuario.ADMINISTRADOR,
                PerfilUsuario.GESTOR_POLO,
                PerfilUsuario.APOIO_COORDENADOR,
            )
            or (
                current_user.perfil == PerfilUsuario.COORDENADOR
                and projeto.coordenador_id == current_user.id
            )
        )
        if not pode_editar:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario nao tem permissao para alterar esta solicitacao",
            )

        return solicitacao

    def _normalizar_usuario(self, current_user: Union[Usuario, int]) -> Usuario:
        if isinstance(current_user, Usuario):
            return current_user

        usuario = self.db.query(Usuario).filter(Usuario.id == current_user).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario nao encontrado",
            )
        return usuario

    def _buscar_versao(self, solicitacao_id: int) -> VersaoRHProjeto:
        versao = (
            self.db.query(VersaoRHProjeto)
            .filter(VersaoRHProjeto.solicitacao_id == solicitacao_id)
            .first()
        )
        if not versao:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solicitacao nao possui versao de RH associada",
            )
        return versao

    def _validar_data_inicio_no_periodo_do_projeto(
        self,
        projeto_id: int,
        data_inicio_membro,
    ) -> None:
        projeto = self.db.query(Projeto).filter(Projeto.id == projeto_id).first()
        if not projeto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto nao encontrado",
            )

        if data_inicio_membro < projeto.data_inicio or data_inicio_membro > projeto.data_fim:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Data de inicio do membro deve estar dentro da vigencia do projeto "
                    f"({projeto.data_inicio.isoformat()} a {projeto.data_fim.isoformat()})"
                ),
            )

    def _validar_orcamento_fontes(
        self,
        projeto_id: int,
        versao_id: int,
        valor_membro,
        fonte_membro,
        membro_id: int | None = None,
    ) -> None:
        fontes = (
            self.db.query(ProjetoFonteFinanciamento)
            .filter(ProjetoFonteFinanciamento.projeto_id == projeto_id)
            .all()
        )
        orcamento_por_fonte = {fonte.fonte: fonte.valor for fonte in fontes}
        total_fontes = sum((fonte.valor for fonte in fontes), Decimal("0"))

        total_por_fonte = {}
        membros = (
            self.db.query(PesquisadorProjeto)
            .filter(PesquisadorProjeto.versao_rh_id == versao_id)
            .all()
        )
        for membro in membros:
            if membro_id is not None and membro.id == membro_id:
                continue
            total_por_fonte[membro.fonte_financiamento] = (
                total_por_fonte.get(membro.fonte_financiamento, Decimal("0"))
                + membro.valor_bolsa
            )
        total_por_fonte[fonte_membro] = (
            total_por_fonte.get(fonte_membro, Decimal("0")) + Decimal(valor_membro)
        )

        total_bolsas = sum(
            total_por_fonte.values(),
            Decimal("0"),
        )

        if total_bolsas > total_fontes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Total de bolsas da equipe "
                    f"(R$ {total_bolsas:.2f}) excede o total das fontes de financiamento "
                    f"do projeto (R$ {total_fontes:.2f})"
                ),
            )

        for fonte, total in total_por_fonte.items():
            orcamento = orcamento_por_fonte.get(fonte, Decimal("0"))
            if total > orcamento:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Total de bolsas da fonte {fonte.value} "
                        f"(R$ {total:.2f}) excede o orçamento desta fonte "
                        f"no projeto (R$ {orcamento:.2f})"
                    ),
                )

    def _buscar_membro_da_solicitacao(
        self, solicitacao_id: int, membro_id: int
    ) -> PesquisadorProjeto:
        versao = (
            self.db.query(VersaoRHProjeto)
            .filter(VersaoRHProjeto.solicitacao_id == solicitacao_id)
            .first()
        )
        if not versao:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Solicitacao nao possui versao de RH associada",
            )

        membro = (
            self.db.query(PesquisadorProjeto)
            .filter(
                PesquisadorProjeto.id == membro_id,
                PesquisadorProjeto.versao_rh_id == versao.id,
            )
            .first()
        )
        if not membro:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membro nao encontrado nesta solicitacao",
            )
        return membro
