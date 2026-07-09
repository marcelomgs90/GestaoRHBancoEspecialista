"""
Testes do recurso ANEXOS por projeto.

Cobre a capability `anexo-projeto`:
  - listagem paginada com filtros `origem`, ordenacao `created_at DESC`
  - upload manual limitado a 4 por projeto
  - download/preview com `Content-Disposition` correto
  - permissao por papel (COORDENADOR do projeto, GESTOR_POLO, ADMINISTRADOR)
  - remocao restrita a `origem=USUARIO`
  - servico interno `criar_sistema` (sem HTTP)
"""

from datetime import date, timedelta
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.datastructures import Headers

from app.core.dependencies import get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.base import Base
from app.models.projeto import Projeto
from app.models.usuario_perfil import Usuario
from app.schemas.anexo import AnexoOrigem
from app.services.anexo_service import AnexoService
from app.utils.enums import PerfilUsuario, StatusProjeto


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def service(db):
    return AnexoService(db)


def _make_usuario(db, perfil: PerfilUsuario, ref: str, email: str) -> Usuario:
    u = Usuario(
        ref_usuario=ref,
        nome=f"Usuario {perfil.value}",
        email=email,
        senha_hash=get_password_hash("senha"),
        perfil=perfil,
        ativo=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def coord(db):
    return _make_usuario(db, PerfilUsuario.COORDENADOR, "111.111.111-11", "coord@example.com")


@pytest.fixture
def outro_coord(db):
    return _make_usuario(db, PerfilUsuario.COORDENADOR, "222.222.222-22", "outro-coord@example.com")


@pytest.fixture
def gestor(db):
    return _make_usuario(db, PerfilUsuario.GESTOR_POLO, "333.333.333-33", "gestor@example.com")


@pytest.fixture
def admin(db):
    return _make_usuario(db, PerfilUsuario.ADMINISTRADOR, "444.444.444-44", "admin@example.com")


@pytest.fixture
def apoio(db):
    return _make_usuario(db, PerfilUsuario.APOIO_COORDENADOR, "555.555.555-55", "apoio@example.com")


@pytest.fixture
def projeto(db, coord):
    hoje = date.today()
    p = Projeto(
        codigo="ANEXO-CRUD-01",
        sigla="ANX",
        titulo="Projeto Anexos",
        data_inicio=hoje,
        data_fim=hoje + timedelta(days=30),
        status=StatusProjeto.ATIVO,
        coordenador_id=coord.id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def _token(usuario: Usuario) -> dict:
    return {"Authorization": f"Bearer {create_access_token({'sub': str(usuario.id)})}"}


def _upload_pdf(nome: str, conteudo: bytes = b"%PDF-1.4\nconteudo"):
    from fastapi import UploadFile
    return UploadFile(
        file=BytesIO(conteudo),
        filename=nome,
        headers=Headers({"content-type": "application/pdf"}),
    )


# ---------- 5.2  GET ?origem=SISTEMA ----------


def test_listar_com_filtro_sistema(client, service, projeto, db):
    service.criar_sistema(projeto.id, b"%PDF-sistema", "gerado.pdf")
    service.criar_usuario(
        projeto.id, _upload_pdf("manual.pdf"), db.query(Usuario).get(projeto.coordenador_id)
    )
    resp = client.get(
        f"/projetos/{projeto.id}/anexos-amplos?origem=SISTEMA",
        headers=_token(db.query(Usuario).get(projeto.coordenador_id)),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["nome_arquivo"] == "gerado.pdf"
    assert data["items"][0]["origem"] == "SISTEMA"


# ---------- 5.3  GET sem filtro ----------


def test_listar_sem_filtro_retorna_tudo(client, service, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    service.criar_sistema(projeto.id, b"sis-1", "sis.pdf")
    service.criar_usuario(projeto.id, _upload_pdf("u1.pdf"), coord)
    service.criar_usuario(projeto.id, _upload_pdf("u2.pdf"), coord)
    resp = client.get(
        f"/projetos/{projeto.id}/anexos-amplos",
        headers=_token(coord),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert data["items"][0]["created_at"] >= data["items"][-1]["created_at"]


# ---------- 5.4  paginacao ----------


def test_listar_paginacao(client, service, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    for i in range(25):
        service.criar_sistema(projeto.id, f"x{i}".encode(), f"sis-{i}.pdf")
    resp = client.get(
        f"/projetos/{projeto.id}/anexos-amplos?page=2&per_page=10",
        headers=_token(coord),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 25
    assert data["pages"] == 3
    assert len(data["items"]) == 10


# ---------- 5.5  per_page fora do range ----------


def test_listar_per_page_invalido(client, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    for valor in (0, 200):
        resp = client.get(
            f"/projetos/{projeto.id}/anexos-amplos?per_page={valor}",
            headers=_token(coord),
        )
        assert resp.status_code == 422


# ---------- 5.6  POST bem-sucedido ----------


def test_upload_sucesso(client, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    pdf_bytes = b"%PDF-1.4\nok"
    resp = client.post(
        f"/projetos/{projeto.id}/anexos-amplos",
        headers=_token(coord),
        files={"arquivo": ("doc.pdf", pdf_bytes, "application/pdf")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["origem"] == "USUARIO"
    assert data["created_by"] == coord.id
    assert "file_bytes" not in data


# ---------- 5.7  POST bloqueado por limite ----------


def test_upload_bloqueado_no_limite(client, service, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    for i in range(4):
        service.criar_usuario(projeto.id, _upload_pdf(f"u{i}.pdf"), coord)
    resp = client.post(
        f"/projetos/{projeto.id}/anexos-amplos",
        headers=_token(coord),
        files={"arquivo": ("excedente.pdf", b"x", "application/pdf")},
    )
    assert resp.status_code == 409
    assert "Limite" in resp.json()["detail"]


# ---------- 5.8  tipo invalido ----------


def test_upload_tipo_invalido(client, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    resp = client.post(
        f"/projetos/{projeto.id}/anexos-amplos",
        headers=_token(coord),
        files={"arquivo": ("foto.png", b"x", "image/png")},
    )
    assert resp.status_code == 400


# ---------- 5.9  tamanho excedido ----------


def test_upload_tamanho_excedido(client, projeto, db, monkeypatch):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    settings_mod = __import__("app.core.config", fromlist=["get_settings"]).get_settings
    settings = settings_mod()
    big = b"x" * (settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024 + 1)
    resp = client.post(
        f"/projetos/{projeto.id}/anexos-amplos",
        headers=_token(coord),
        files={"arquivo": ("big.pdf", big, "application/pdf")},
    )
    assert resp.status_code == 400


# ---------- 5.10  APOIO_COORDENADOR ----------


def test_upload_apoio_bloqueado(client, projeto, apoio):
    resp = client.post(
        f"/projetos/{projeto.id}/anexos-amplos",
        headers=_token(apoio),
        files={"arquivo": ("x.pdf", b"x", "application/pdf")},
    )
    assert resp.status_code == 403


# ---------- 5.11  COORDENADOR de outro projeto ----------


def test_upload_coordenador_de_outro_projeto(client, projeto, outro_coord):
    resp = client.post(
        f"/projetos/{projeto.id}/anexos-amplos",
        headers=_token(outro_coord),
        files={"arquivo": ("x.pdf", b"x", "application/pdf")},
    )
    assert resp.status_code == 403


# ---------- 5.12  download ----------


def test_download_anexo(client, service, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    anexo = service.criar_usuario(projeto.id, _upload_pdf("d.pdf", b"%PDF-d"), coord)
    resp = client.get(
        f"/projetos/{projeto.id}/anexos-amplos/{anexo.id}/download",
        headers=_token(coord),
    )
    assert resp.status_code == 200
    assert resp.headers["content-disposition"].startswith("attachment")
    assert resp.content == b"%PDF-d"


# ---------- 5.13  preview ----------


def test_preview_anexo(client, service, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    anexo = service.criar_usuario(projeto.id, _upload_pdf("p.pdf", b"%PDF-p"), coord)
    resp = client.get(
        f"/projetos/{projeto.id}/anexos-amplos/{anexo.id}/preview",
        headers=_token(coord),
    )
    assert resp.status_code == 200
    assert "inline" in resp.headers["content-disposition"]
    assert resp.headers["content-type"] == "application/pdf"


# ---------- 5.14  DELETE usuario ----------


def test_delete_anexo_usuario(client, service, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    anexo = service.criar_usuario(projeto.id, _upload_pdf("del.pdf", b"x"), coord)
    resp = client.delete(
        f"/projetos/{projeto.id}/anexos-amplos/{anexo.id}",
        headers=_token(coord),
    )
    assert resp.status_code == 204
    db.expire_all()
    from app.models.anexo import Anexo as AnexoModel
    assert service.db.query(AnexoModel).filter_by(id=anexo.id).first() is None


# ---------- 5.15  DELETE sistema ----------


def test_delete_anexo_sistema_bloqueado(client, service, projeto, db):
    coord = db.query(Usuario).get(projeto.coordenador_id)
    anexo = service.criar_sistema(projeto.id, b"%PDF-sis", "sis.pdf")
    resp = client.delete(
        f"/projetos/{projeto.id}/anexos-amplos/{anexo.id}",
        headers=_token(coord),
    )
    assert resp.status_code == 403


# ---------- 5.16  criar_sistema direto ----------


def test_criar_sistema_direto_sem_http(service, projeto, db):
    anexo = service.criar_sistema(projeto.id, b"%PDF-inter", "interno.pdf")
    db.refresh(anexo)
    assert anexo.created_by is None
    assert anexo.origem == "SISTEMA"
    itens, total = service.listar(
        projeto_id=projeto.id,
        current_user=db.query(Usuario).get(projeto.coordenador_id),
        origem=AnexoOrigem.SISTEMA,
    )
    assert total == 1
