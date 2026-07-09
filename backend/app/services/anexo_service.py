from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.anexo import Anexo
from app.models.projeto import Projeto
from app.models.usuario_perfil import Usuario
from app.schemas.anexo import AnexoOrigem
from app.utils.enums import PerfilUsuario


ALLOWED_ANEXO_MIME_TYPES = {"application/pdf"}


class AnexoService:
    """Servico de anexos amplos do projeto (origem USUARIO ou SISTEMA).

    A regra de limite de 4 uploads por projeto se aplica apenas a
    `origem='USUARIO'`. Anexos com `origem='SISTEMA'` sao criados internamente
    por outros services (ex.: `SolicitacaoService.aprovar`) via `criar_sistema`
    e nao contam nem disputam o limite.
    """

    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def listar(
        self,
        projeto_id: int,
        current_user: Usuario,
        origem: Optional[AnexoOrigem] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Anexo], int]:
        self._obter_projeto_para_operacao(projeto_id, current_user)

        query = self.db.query(Anexo).filter(Anexo.id_projeto == projeto_id)
        if origem is not None:
            query = query.filter(Anexo.origem == origem.value)

        total = query.count()
        itens = (
            query.order_by(Anexo.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return itens, total

    def obter(
        self, projeto_id: int, anexo_id: UUID, current_user: Usuario
    ) -> Anexo:
        self._obter_projeto_para_operacao(projeto_id, current_user)
        anexo = (
            self.db.query(Anexo)
            .filter(
                Anexo.id == anexo_id,
                Anexo.id_projeto == projeto_id,
            )
            .first()
        )
        if not anexo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Anexo nao encontrado",
            )
        return anexo

    def download(
        self, projeto_id: int, anexo_id: UUID, current_user: Usuario
    ) -> Anexo:
        return self.obter(projeto_id, anexo_id, current_user)

    def preview(
        self, projeto_id: int, anexo_id: UUID, current_user: Usuario
    ) -> Anexo:
        return self.obter(projeto_id, anexo_id, current_user)

    def criar_usuario(
        self,
        projeto_id: int,
        arquivo: UploadFile,
        current_user: Usuario,
    ) -> Anexo:
        projeto = self._obter_projeto_para_operacao(projeto_id, current_user)
        self._validar_permissao_upload(projeto, current_user)
        self._validar_limite(projeto_id)

        if arquivo.content_type not in ALLOWED_ANEXO_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas arquivos PDF sao permitidos",
            )

        conteudo = arquivo.file.read()
        tamanho_maximo = self.settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(conteudo) > tamanho_maximo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Arquivo excede o limite de "
                    f"{self.settings.MAX_UPLOAD_SIZE_MB} MB"
                ),
            )

        nome_original = arquivo.filename or "documento.pdf"
        anexo = Anexo(
            id_projeto=projeto_id,
            file_type=arquivo.content_type,
            file_bytes=conteudo,
            nome_arquivo=nome_original,
            tamanho_bytes=len(conteudo),
            created_by=current_user.id,
            origem="USUARIO",
        )
        self.db.add(anexo)
        self.db.commit()
        self.db.refresh(anexo)
        return anexo

    def criar_sistema(
        self,
        projeto_id: int,
        file_bytes: bytes,
        nome_arquivo: str,
    ) -> Anexo:
        """Cria anexo com `origem='SISTEMA'` sem aplicar `_validar_limite`.

        Uso restrito a outros services do backend que precisem registrar um
        PDF gerado pelo proprio sistema (ex.: ao aprovar uma solicitacao).
        Nao deve ser exposto por endpoint publico.
        """
        anexo = Anexo(
            id_projeto=projeto_id,
            file_type="application/pdf",
            file_bytes=file_bytes,
            nome_arquivo=nome_arquivo,
            tamanho_bytes=len(file_bytes),
            created_by=None,
            origem="SISTEMA",
        )
        self.db.add(anexo)
        self.db.commit()
        self.db.refresh(anexo)
        return anexo

    def remover(
        self,
        projeto_id: int,
        anexo_id: UUID,
        current_user: Usuario,
    ) -> None:
        projeto = self._obter_projeto_para_operacao(projeto_id, current_user)
        self._validar_permissao_upload(projeto, current_user)

        anexo = self.obter(projeto_id, anexo_id, current_user)
        if anexo.origem != AnexoOrigem.USUARIO.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anexos gerados pelo sistema nao podem ser removidos",
            )

        self.db.delete(anexo)
        self.db.commit()

    def _obter_projeto_para_operacao(
        self, projeto_id: int, current_user: Usuario
    ) -> Projeto:
        """Reusa o guard de visibilidade utilizado por `ProjetoService`."""
        projeto = (
            self.db.query(Projeto).filter(Projeto.id == projeto_id).first()
        )
        if not projeto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto nao encontrado",
            )

        perfil = current_user.perfil
        if perfil in (PerfilUsuario.ADMINISTRADOR, PerfilUsuario.GESTOR_POLO):
            return projeto
        if perfil == PerfilUsuario.COORDENADOR:
            if projeto.coordenador_id == current_user.id:
                return projeto
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Coordenador so pode acessar anexos de projetos "
                    "dos quais e responsavel"
                ),
            )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a equipe do projeto",
        )

    def _validar_permissao_upload(
        self, projeto: Projeto, current_user: Usuario
    ) -> None:
        perfil = current_user.perfil
        if perfil in (PerfilUsuario.ADMINISTRADOR, PerfilUsuario.GESTOR_POLO):
            return
        if (
            perfil == PerfilUsuario.COORDENADOR
            and projeto.coordenador_id == current_user.id
        ):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Sem permissao para enviar anexos neste projeto"
            ),
        )

    def _validar_limite(self, projeto_id: int) -> None:
        count = (
            self.db.query(Anexo)
            .filter(
                Anexo.id_projeto == projeto_id,
                Anexo.origem == AnexoOrigem.USUARIO.value,
            )
            .count()
        )
        if count >= self.settings.MAX_ANEXOS_USUARIO_POR_PROJETO:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Limite de "
                    f"{self.settings.MAX_ANEXOS_USUARIO_POR_PROJETO} "
                    f"anexos enviados por projeto atingido"
                ),
            )
