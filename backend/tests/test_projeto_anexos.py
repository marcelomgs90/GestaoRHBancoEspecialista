from datetime import date, timedelta
from io import BytesIO

from fastapi import UploadFile
from starlette.datastructures import Headers

from app.models.projeto import Projeto
from app.models.usuario_perfil import Usuario
from app.services.projeto_service import ProjetoService
from app.utils.enums import PerfilUsuario, StatusProjeto, TipoDocumentoProjeto


def _usuario_coordenador(db_session) -> Usuario:
    usuario = Usuario(
        ref_usuario="111.111.111-11",
        nome="Coordenador",
        email="coord-anexos@example.com",
        senha_hash="hash",
        perfil=PerfilUsuario.COORDENADOR,
        ativo=True,
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    return usuario


def _projeto(db_session, coordenador: Usuario) -> Projeto:
    hoje = date.today()
    projeto = Projeto(
        codigo="ANEXOS-001",
        sigla="ANEXOS",
        titulo="Projeto com anexos",
        data_inicio=hoje,
        data_fim=hoje + timedelta(days=30),
        status=StatusProjeto.ATIVO,
        coordenador_id=coordenador.id,
    )
    db_session.add(projeto)
    db_session.commit()
    db_session.refresh(projeto)
    return projeto


def _upload_file(nome: str, conteudo: bytes = b"conteudo") -> UploadFile:
    return UploadFile(
        file=BytesIO(conteudo),
        filename=nome,
        headers=Headers({"content-type": "application/pdf"}),
    )


def _service(db_session, tmp_path, monkeypatch) -> ProjetoService:
    service = ProjetoService(db_session)
    monkeypatch.setattr(service.settings, "UPLOAD_DIR", str(tmp_path))
    return service


def test_documento_complementar_permite_multiplos_anexos(db_session, tmp_path, monkeypatch):
    usuario = _usuario_coordenador(db_session)
    projeto = _projeto(db_session, usuario)
    service = _service(db_session, tmp_path, monkeypatch)

    primeiro = service.salvar_anexo(
        projeto.id,
        TipoDocumentoProjeto.DOCUMENTO_COMPLEMENTAR,
        _upload_file("primeiro.pdf", b"primeiro"),
        usuario,
    )
    segundo = service.salvar_anexo(
        projeto.id,
        TipoDocumentoProjeto.DOCUMENTO_COMPLEMENTAR,
        _upload_file("segundo.pdf", b"segundo"),
        usuario,
    )

    anexos = service.listar_anexos(projeto.id, usuario)

    assert primeiro.id != segundo.id
    assert len(anexos) == 2
    assert {anexo.nome_arquivo_original for anexo in anexos} == {
        "primeiro.pdf",
        "segundo.pdf",
    }


def test_documento_unico_continua_substituindo_anexo_anterior(db_session, tmp_path, monkeypatch):
    usuario = _usuario_coordenador(db_session)
    projeto = _projeto(db_session, usuario)
    service = _service(db_session, tmp_path, monkeypatch)

    primeiro = service.salvar_anexo(
        projeto.id,
        TipoDocumentoProjeto.PLANO_TRABALHO,
        _upload_file("plano-v1.pdf", b"v1"),
        usuario,
    )
    segundo = service.salvar_anexo(
        projeto.id,
        TipoDocumentoProjeto.PLANO_TRABALHO,
        _upload_file("plano-v2.pdf", b"v2"),
        usuario,
    )

    anexos = service.listar_anexos(projeto.id, usuario)

    assert primeiro.id == segundo.id
    assert len(anexos) == 1
    assert anexos[0].nome_arquivo_original == "plano-v2.pdf"


def test_remover_documento_complementar_preserva_os_demais(db_session, tmp_path, monkeypatch):
    usuario = _usuario_coordenador(db_session)
    projeto = _projeto(db_session, usuario)
    service = _service(db_session, tmp_path, monkeypatch)

    primeiro = service.salvar_anexo(
        projeto.id,
        TipoDocumentoProjeto.DOCUMENTO_COMPLEMENTAR,
        _upload_file("primeiro.pdf", b"primeiro"),
        usuario,
    )
    segundo = service.salvar_anexo(
        projeto.id,
        TipoDocumentoProjeto.DOCUMENTO_COMPLEMENTAR,
        _upload_file("segundo.pdf", b"segundo"),
        usuario,
    )

    service.remover_anexo(projeto.id, primeiro.id, usuario)
    anexos = service.listar_anexos(projeto.id, usuario)

    assert [anexo.id for anexo in anexos] == [segundo.id]
    assert anexos[0].nome_arquivo_original == "segundo.pdf"
