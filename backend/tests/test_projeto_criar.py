"""
Testes do fluxo de criacao de projeto com escolha de coordenador.

Cobre as capabilities:
  - projeto-coordenador: RBAC por perfil + bridge Pesquisador<->Usuario.
  - pesquisador-listagem: endpoint /especialistas/pesquisadores/.

Os testes dao continuidade ao padrao ja estabelecido em
`backend/tests/test_membros_projeto.py` (SQLite em memoria + token JWT manual
via `create_access_token`).
"""
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.dependencies import get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.base import Base
from app.models.usuario_perfil import Usuario
from app.utils.enums import (
    FonteFinanciamento,
    PerfilUsuario,
    StatusProjeto,
)


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Sessao de banco isolada por teste (SQLite em memoria)."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    """Cliente de teste do FastAPI."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ----- fixtures de Usuario -----


def _make_usuario(db_session, perfil: PerfilUsuario, ref_usuario: str, email: str) -> Usuario:
    user = Usuario(
        ref_usuario=ref_usuario,
        nome=f"Usuario {perfil.value}",
        email=email,
        senha_hash=get_password_hash("senha123"),
        perfil=perfil,
        ativo=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def coord(db_session):
    return _make_usuario(db_session, PerfilUsuario.COORDENADOR, "111.111.111-11", "coord@x.com")


@pytest.fixture
def gestor(db_session):
    return _make_usuario(db_session, PerfilUsuario.GESTOR_POLO, "222.222.222-22", "gestor@x.com")


@pytest.fixture
def admin(db_session):
    return _make_usuario(db_session, PerfilUsuario.ADMINISTRADOR, "000.000.000-01", "admin@x.com")


@pytest.fixture
def apoio(db_session):
    return _make_usuario(db_session, PerfilUsuario.APOIO_COORDENADOR, "333.333.333-33", "apoio@x.com")


@pytest.fixture
def servidor_alvo(db_session):
    """Usuario interno adicional que pode ser escolhido como coordenador."""
    return _make_usuario(db_session, PerfilUsuario.COORDENADOR, "444.444.444-44", "alvo@x.com")


# ----- helpers -----


def _auth(user: Usuario) -> dict:
    token = create_access_token({"sub": str(user.id), "perfil": user.perfil.value})
    return {"Authorization": f"Bearer {token}"}


def _payload_basico() -> dict:
    hoje = date.today()
    return {
        "titulo": "Projeto Teste",
        "data_inicio": hoje.isoformat(),
        "data_fim": (hoje + timedelta(days=365)).isoformat(),
        "fontes_financiamento": [
            {"fonte": FonteFinanciamento.EMPRESA.value, "valor": 100000},
        ],
    }


# ----- 5.2: COORDENADOR cria sem coordenador_ref -----


def test_coordenador_cria_sem_referencia_coordenador_id_e_self(client, coord):
    resp = client.post(
        "/projetos/",
        json=_payload_basico(),
        headers=_auth(coord),
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["coordenador_id"] == coord.id


# ----- 5.3: COORDENADOR cria com coordenador_ref — campo eh ignorado -----


def test_coordenador_cria_com_referencia_campo_e_ignorado(client, coord, servidor_alvo):
    payload = _payload_basico()
    payload["coordenador_ref_pesquisador"] = servidor_alvo.ref_usuario

    resp = client.post("/projetos/", json=payload, headers=_auth(coord))
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["coordenador_id"] == coord.id, "COORDENADOR sempre usa self"


# ----- 5.4: GESTOR_POLO cria com referencia valida -----


def test_gestor_cria_com_referencia_valida(client, gestor, servidor_alvo):
    payload = _payload_basico()
    payload["coordenador_ref_pesquisador"] = servidor_alvo.ref_usuario

    resp = client.post("/projetos/", json=payload, headers=_auth(gestor))
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["coordenador_id"] == servidor_alvo.id


# ----- 5.5: ADMINISTRADOR cria com referencia valida -----


def test_admin_cria_com_referencia_valida(client, admin, servidor_alvo):
    payload = _payload_basico()
    payload["coordenador_ref_pesquisador"] = servidor_alvo.ref_usuario

    resp = client.post("/projetos/", json=payload, headers=_auth(admin))
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["coordenador_id"] == servidor_alvo.id


# ----- 5.6: GESTOR_POLO sem coordenador_ref -----


def test_gestor_sem_referencia_retorna_400(client, gestor):
    resp = client.post("/projetos/", json=_payload_basico(), headers=_auth(gestor))
    assert resp.status_code == 400, resp.text
    detail = resp.json().get("detail", "")
    assert "obrigatorio" in detail.lower() or "coordenador" in detail.lower()


# ----- 5.7: GESTOR_POLO com referencia inexistente -----


def test_gestor_com_referencia_inexistente_retorna_400(client, gestor):
    payload = _payload_basico()
    payload["coordenador_ref_pesquisador"] = "999.999.999-99"

    resp = client.post("/projetos/", json=payload, headers=_auth(gestor))
    assert resp.status_code == 400, resp.text
    detail = resp.json().get("detail", "")
    assert "cadastro" in detail.lower() or "nao encontrado" in detail.lower() or "ref_usuario" in detail.lower()


# ----- 5.8: APOIO_COORDENADOR -----


def test_apoio_coordenador_retorna_403(client, apoio):
    resp = client.post("/projetos/", json=_payload_basico(), headers=_auth(apoio))
    assert resp.status_code == 403, resp.text


# ----- 5.9 / 5.10 / 5.11: pesquisador-listagem -----
#
# Estes casos dependem do Banco Especialista estar disponivel. O teste
# verifica apenas o caminho de auth (5.11). Os demais cenarios sao cobertos
# por testes unitarios do service em ambiente de integracao.


def test_listar_pesquisadores_sem_auth_retorna_401(client):
    resp = client.get("/especialistas/pesquisadores/")
    assert resp.status_code == 401, resp.text


def test_listar_pesquisadores_banco_indisponivel_retorna_503(client, coord):
    # Quando BANCO_ESPECIALISTAS_URL nao esta configurada, EspecialistasSessionLocal
    # e None e get_especialistas_db lanca 503.
    from app.core import database as db_mod

    original = db_mod.EspecialistasSessionLocal
    db_mod.EspecialistasSessionLocal = None
    try:
        resp = client.get(
            "/especialistas/pesquisadores/",
            headers=_auth(coord),
        )
        assert resp.status_code == 503, resp.text
    finally:
        db_mod.EspecialistasSessionLocal = original