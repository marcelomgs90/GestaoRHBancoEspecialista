from datetime import date
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.solicitacao_rh import SolicitacaoRH
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.models.projeto import Projeto  # Importado para checar o coordenador
from app.schemas.membro import MembroCreate, MembroUpdate
from app.services.parametro_service import ParametroService
from app.utils.enums import StatusSolicitacao


class MembroService:
    def __init__(self, db: Session):
        self.db = db
        self.parametros = ParametroService(db)

    def incluir(
        self, solicitacao_id: int, dados: MembroCreate, usuario_logado_id: int
    ) -> PesquisadorProjeto:
        # Passa o usuário logado para validar se ele é o coordenador do projeto
        solicitacao = self._buscar_solicitacao_editavel(solicitacao_id, usuario_logado_id)
        versao = self._buscar_versao(solicitacao.id)

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
        # Qualquer usuário autenticado envolvido pode listar os membros
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
        self, solicitacao_id: int, membro_id: int, dados: MembroUpdate, usuario_logado_id: int
    ) -> PesquisadorProjeto:
        # Garante que a solicitação pertence ao coordenador antes de atualizar
        solicitacao = self._buscar_solicitacao_editavel(solicitacao_id, usuario_logado_id)
        membro = self._buscar_membro_da_solicitacao(solicitacao_id, membro_id)

        campos_alterados = dados.model_dump(exclude_unset=True)
        for field, value in campos_alterados.items():
            setattr(membro, field, value)

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

        self.db.commit()
        self.db.refresh(membro)
        return membro

    def remover(self, solicitacao_id: int, membro_id: int, usuario_logado_id: int) -> None:
        """
        Substitui o antigo método 'encerrar' por uma deleção física real.
        Como a solicitação está em fase de 'EM_EDICAO' (Proposta), o coordenador
        pode remover o membro inserido incorretamente antes de enviar para homologação.
        """
        self._buscar_solicitacao_editavel(solicitacao_id, usuario_logado_id)
        membro = self._buscar_membro_da_solicitacao(solicitacao_id, membro_id)
        
        self.db.delete(membro)
        self.db.commit()

    def _buscar_solicitacao_editavel(self, solicitacao_id: int, usuario_logado_id: int) -> SolicitacaoRH:
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

        # 🛡️ VALIDAÇÃO CRÍTICA DE SEGURANÇA: O solicitante deve ser o coordenador do projeto
        projeto = self.db.query(Projeto).filter(Projeto.id == solicitacao.projeto_id).first()
        if not projeto or projeto.coordenador_id != usuario_logado_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario nao tem permissao para alterar esta solicitacao",
            )

        return solicitacao

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
                status_code=status.HTTP_442_UNPROCESSABLE_ENTITY,
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