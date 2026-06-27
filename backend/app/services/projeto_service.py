from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import selectinload
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.projeto_anexo import ProjetoAnexo
from app.models.projeto_fonte_financiamento import ProjetoFonteFinanciamento
from app.models.projeto import Projeto
from app.models.usuario_perfil import Usuario
from app.schemas.projeto import ProjetoCreate, ProjetoUpdate
from app.utils.enums import PerfilUsuario, StatusProjeto, TipoDocumentoProjeto


ALLOWED_ATTACHMENT_EXTENSIONS = {".pdf", ".doc", ".docx"}


class ProjetoService:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()

    def criar(self, dados: ProjetoCreate, current_user: Usuario) -> Projeto:
        """Cria um projeto.

        Regra RBAC + bridge Pesquisador<->Usuario:
          - Perfis sem permissao (ex.: APOIO_COORDENADOR) sao rejeitados (403).
          - COORDENADOR: campo `coordenador_ref_pesquisador` e IGNORADO; o
            coordenador e sempre o proprio `current_user`.
          - ADMINISTRADOR / GESTOR_POLO: campo `coordenador_ref_pesquisador`
            e OBRIGATORIO; o sistema resolve o `Usuario` interno cuja
            coluna `ref_usuario` seja igual a referencia enviada. Se nao
            houver `Usuario` correspondente, retorna 400.
        """
        self._validar_permissao_criacao(current_user)

        payload = dados.model_dump(mode="json")
        fontes = payload.pop("fontes_financiamento")
        coordenador_ref = payload.pop("coordenador_ref_pesquisador", None)
        payload["codigo"] = payload.get("codigo") or self._gerar_codigo()

        existente = self.db.query(Projeto).filter(Projeto.codigo == payload["codigo"]).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um projeto com este código",
            )

        coordenador_id = self._resolver_coordenador_id(
            current_user=current_user,
            coordenador_ref_pesquisador=coordenador_ref,
        )

        projeto = Projeto(
            **payload,
            coordenador_id=coordenador_id,
        )
        projeto.fontes_financiamento = [
            ProjetoFonteFinanciamento(
                fonte=fonte["fonte"],
                valor=fonte["valor"],
            )
            for fonte in fontes
        ]
        self.db.add(projeto)
        self.db.commit()
        self.db.refresh(projeto)
        return projeto

    def _validar_permissao_criacao(self, current_user: Usuario) -> None:
        """Apenas ADMINISTRADOR, GESTOR_POLO e COORDENADOR podem criar projetos."""
        if current_user.perfil in (
            PerfilUsuario.ADMINISTRADOR,
            PerfilUsuario.GESTOR_POLO,
            PerfilUsuario.COORDENADOR,
        ):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administrador, gestor do polo ou coordenador podem criar projetos",
        )

    def _resolver_coordenador_id(
        self,
        current_user: Usuario,
        coordenador_ref_pesquisador: Optional[str],
    ) -> int:
        """Resolve o `coordenador_id` conforme o perfil e a referencia enviada.

        - COORDENADOR: ignora a referencia e usa `current_user.id`.
        - ADMINISTRADOR / GESTOR_POLO: exige a referencia; busca o `Usuario`
          interno cuja `ref_usuario` seja igual a referencia enviada.
        """
        if current_user.perfil == PerfilUsuario.COORDENADOR:
            return current_user.id

        if not coordenador_ref_pesquisador or not coordenador_ref_pesquisador.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Para o seu perfil, e obrigatorio informar o coordenador "
                    "do projeto (selecione um pesquisador-servidor no campo Coordenador)"
                ),
            )

        ref_normalizada = coordenador_ref_pesquisador.strip()
        usuario = (
            self.db.query(Usuario)
            .filter(Usuario.ref_usuario == ref_normalizada)
            .first()
        )
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Pesquisador selecionado nao possui cadastro no Gestao RH "
                    "(ref_usuario nao encontrado). Realize o cadastro previo."
                ),
            )

        return usuario.id

    def _gerar_codigo(self) -> str:
        base = f"PROJ-{datetime.utcnow():%Y%m%d%H%M%S}"
        codigo = base
        sufixo = 1
        while self.db.query(Projeto.id).filter(Projeto.codigo == codigo).first():
            sufixo += 1
            codigo = f"{base}-{sufixo}"
        return codigo

    def listar(self, current_user: Usuario, status_filtro: Optional[StatusProjeto] = None) -> List[Projeto]:
        query = self.db.query(Projeto).options(
            selectinload(Projeto.fontes_financiamento),
            selectinload(Projeto.coordenador),
        )

        if current_user.perfil == PerfilUsuario.COORDENADOR:
            query = query.filter(Projeto.coordenador_id == current_user.id)
        # APOIO_COORDENADOR, ADMINISTRADOR e GESTOR_POLO veem todos por enquanto

        if status_filtro:
            query = query.filter(Projeto.status == status_filtro)

        return query.all()

    def obter_por_id(self, projeto_id: int, current_user: Usuario) -> Projeto:
        projeto = (
            self.db.query(Projeto)
            .options(
                selectinload(Projeto.fontes_financiamento),
                selectinload(Projeto.coordenador),
            )
            .filter(Projeto.id == projeto_id)
            .first()
        )

        if not projeto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado",
            )

        if (
            current_user.perfil == PerfilUsuario.COORDENADOR
            and projeto.coordenador_id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado a este projeto",
            )

        return projeto

    def atualizar(self, projeto_id: int, dados: ProjetoUpdate, current_user: Usuario) -> Projeto:
        projeto = self.obter_por_id(projeto_id, current_user)
        self._validar_permissao_edicao(projeto, current_user)

        projeto.titulo = dados.titulo
        projeto.descricao = dados.descricao
        projeto.data_inicio = dados.data_inicio
        projeto.data_fim = dados.data_fim
        projeto.status = dados.status

        self.db.commit()
        self.db.refresh(projeto)
        return self.obter_por_id(projeto.id, current_user)

    def listar_anexos(self, projeto_id: int, current_user: Usuario) -> List[ProjetoAnexo]:
        self.obter_por_id(projeto_id, current_user)
        return (
            self.db.query(ProjetoAnexo)
            .filter(ProjetoAnexo.projeto_id == projeto_id)
            .order_by(ProjetoAnexo.tipo_documento.asc())
            .all()
        )

    def obter_anexo(self, projeto_id: int, anexo_id: int, current_user: Usuario) -> ProjetoAnexo:
        self.obter_por_id(projeto_id, current_user)
        anexo = (
            self.db.query(ProjetoAnexo)
            .filter(
                ProjetoAnexo.id == anexo_id,
                ProjetoAnexo.projeto_id == projeto_id,
            )
            .first()
        )
        if not anexo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Anexo nao encontrado",
            )
        return anexo

    def caminho_absoluto_anexo(self, anexo: ProjetoAnexo) -> Path:
        caminho = Path(anexo.caminho_arquivo)
        if caminho.is_absolute():
            return caminho
        return Path(self.settings.UPLOAD_DIR) / caminho

    def salvar_anexo(
        self,
        projeto_id: int,
        tipo_documento: TipoDocumentoProjeto,
        arquivo: UploadFile,
        current_user: Usuario,
        numero_documento: Optional[str] = None,
    ) -> ProjetoAnexo:
        projeto = self.obter_por_id(projeto_id, current_user)
        self._validar_permissao_edicao(projeto, current_user)

        nome_original = Path(arquivo.filename or "").name
        extensao = Path(nome_original).suffix.lower()
        if not nome_original or extensao not in ALLOWED_ATTACHMENT_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de arquivo nao permitido",
            )

        conteudo = arquivo.file.read()
        tamanho_maximo = self.settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(conteudo) > tamanho_maximo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Arquivo excede o limite de {self.settings.MAX_UPLOAD_SIZE_MB} MB",
            )

        anexo_anterior = (
            self.db.query(ProjetoAnexo)
            .filter(
                ProjetoAnexo.projeto_id == projeto_id,
                ProjetoAnexo.tipo_documento == tipo_documento.value,
            )
            .first()
        )

        diretorio_relativo = Path("projetos") / str(projeto_id) / tipo_documento.value.lower()
        diretorio = Path(self.settings.UPLOAD_DIR) / diretorio_relativo
        diretorio.mkdir(parents=True, exist_ok=True)

        caminho_relativo = diretorio_relativo / nome_original
        caminho_absoluto = Path(self.settings.UPLOAD_DIR) / caminho_relativo
        caminho_absoluto.write_bytes(conteudo)

        if anexo_anterior:
            caminho_anterior = self.caminho_absoluto_anexo(anexo_anterior)
            if caminho_anterior != caminho_absoluto:
                self._remover_arquivo_anexo(anexo_anterior)
            anexo_anterior.numero_documento = numero_documento
            anexo_anterior.caminho_arquivo = str(caminho_relativo).replace("\\", "/")
            anexo_anterior.nome_arquivo_original = nome_original
            anexo_anterior.content_type = arquivo.content_type
            anexo_anterior.tamanho_bytes = len(conteudo)
            anexo_anterior.data_upload = datetime.utcnow()
            anexo = anexo_anterior
        else:
            anexo = ProjetoAnexo(
                projeto_id=projeto_id,
                tipo_documento=tipo_documento.value,
                numero_documento=numero_documento,
                caminho_arquivo=str(caminho_relativo).replace("\\", "/"),
                nome_arquivo_original=nome_original,
                content_type=arquivo.content_type,
                tamanho_bytes=len(conteudo),
            )
            self.db.add(anexo)

        self.db.commit()
        self.db.refresh(anexo)
        return anexo

    def remover_anexo(self, projeto_id: int, anexo_id: int, current_user: Usuario) -> None:
        projeto = self.obter_por_id(projeto_id, current_user)
        self._validar_permissao_edicao(projeto, current_user)
        anexo = self.obter_anexo(projeto_id, anexo_id, current_user)
        self._remover_arquivo_anexo(anexo)
        self.db.delete(anexo)
        self.db.commit()

    def _remover_arquivo_anexo(self, anexo: ProjetoAnexo) -> None:
        caminho = self.caminho_absoluto_anexo(anexo)
        try:
            if caminho.exists() and caminho.is_file():
                caminho.unlink()
        except OSError:
            pass

    def _validar_permissao_edicao(self, projeto: Projeto, current_user: Usuario) -> None:
        if current_user.perfil in (PerfilUsuario.ADMINISTRADOR, PerfilUsuario.GESTOR_POLO):
            return

        if (
            current_user.perfil == PerfilUsuario.COORDENADOR
            and projeto.coordenador_id == current_user.id
        ):
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administrador, gestor do polo ou coordenador responsavel pode editar o projeto",
        )
