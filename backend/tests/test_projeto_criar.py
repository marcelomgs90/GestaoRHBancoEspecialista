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
from app.models.solicitacao_rh import SolicitacaoRH
from app.models.usuario_perfil import Usuario
from app.utils.enums import (
    FonteFinanciamento,
    PerfilUsuario,
    TipoSolicitacao,
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
        "sigla": "PROJTESTE",
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


def test_coordenador_cria_com_referencia_selecionada_respeita_escolha(client, coord, servidor_alvo):
    payload = _payload_basico()
    payload["coordenador_ref_pesquisador"] = servidor_alvo.ref_usuario

    resp = client.post("/projetos/", json=payload, headers=_auth(coord))
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["coordenador_id"] == servidor_alvo.id


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


def test_listar_projetos_retorna_mais_recentes_primeiro(client, admin, servidor_alvo):
    ids_criados = []
    for indice in range(3):
        payload = _payload_basico()
        payload["sigla"] = f"PROJ{indice}"
        payload["titulo"] = f"Projeto {indice}"
        payload["coordenador_ref_pesquisador"] = servidor_alvo.ref_usuario

        resp = client.post("/projetos/", json=payload, headers=_auth(admin))
        assert resp.status_code == 201, resp.text
        ids_criados.append(resp.json()["id"])

    listar_resp = client.get("/projetos/", headers=_auth(admin))
    assert listar_resp.status_code == 200, listar_resp.text

    ids_listados = [item["id"] for item in listar_resp.json()]
    assert ids_listados == sorted(ids_criados, reverse=True)


def test_criar_projeto_com_sigla_duplicada_retorna_409(client, admin, servidor_alvo):
    payload = _payload_basico()
    payload["sigla"] = "SIGLA1"
    payload["coordenador_ref_pesquisador"] = servidor_alvo.ref_usuario

    primeiro_resp = client.post("/projetos/", json=payload, headers=_auth(admin))
    assert primeiro_resp.status_code == 201, primeiro_resp.text

    duplicado_resp = client.post("/projetos/", json=payload, headers=_auth(admin))
    assert duplicado_resp.status_code == 409, duplicado_resp.text
    assert "sigla" in duplicado_resp.json()["detail"].lower()


def test_atualizar_projeto_com_sigla_duplicada_retorna_409(client, admin, servidor_alvo):
    projetos = []
    for indice, sigla in enumerate(("SIGLA1", "SIGLA2")):
        payload = _payload_basico()
        payload["sigla"] = sigla
        payload["titulo"] = f"Projeto {indice}"
        payload["coordenador_ref_pesquisador"] = servidor_alvo.ref_usuario

        resp = client.post("/projetos/", json=payload, headers=_auth(admin))
        assert resp.status_code == 201, resp.text
        projetos.append(resp.json())

    update_payload = {
        "codigo": projetos[1]["codigo"],
        "sigla": projetos[0]["sigla"],
        "titulo": projetos[1]["titulo"],
        "descricao": projetos[1]["descricao"],
        "data_inicio": projetos[1]["data_inicio"],
        "data_fim": projetos[1]["data_fim"],
        "status": projetos[1]["status"],
    }

    resp = client.put(
        f"/projetos/{projetos[1]['id']}",
        json=update_payload,
        headers=_auth(admin),
    )
    assert resp.status_code == 409, resp.text
    assert "sigla" in resp.json()["detail"].lower()


def test_coordenador_que_alocou_outro_coordenador_so_ve_lista_e_detalhe(
    client,
    db_session,
    coord,
    servidor_alvo,
):
    payload = _payload_basico()
    payload["coordenador_ref_pesquisador"] = servidor_alvo.ref_usuario

    criar_resp = client.post("/projetos/", json=payload, headers=_auth(coord))
    assert criar_resp.status_code == 201, criar_resp.text
    projeto = criar_resp.json()

    listar_resp = client.get("/projetos/", headers=_auth(coord))
    assert listar_resp.status_code == 200, listar_resp.text
    assert projeto["id"] in [item["id"] for item in listar_resp.json()]

    detalhe_resp = client.get(f"/projetos/{projeto['id']}", headers=_auth(coord))
    assert detalhe_resp.status_code == 200, detalhe_resp.text

    update_payload = {
        **payload,
        "titulo": "Projeto Teste Atualizado",
        "status": StatusProjeto.ATIVO.value,
    }
    editar_resp = client.put(
        f"/projetos/{projeto['id']}",
        json=update_payload,
        headers=_auth(coord),
    )
    assert editar_resp.status_code == 403, editar_resp.text

    anexos_resp = client.get(f"/projetos/{projeto['id']}/anexos", headers=_auth(coord))
    assert anexos_resp.status_code == 403, anexos_resp.text

    versoes_resp = client.get(f"/projetos/{projeto['id']}/versoes", headers=_auth(coord))
    assert versoes_resp.status_code == 403, versoes_resp.text

    pesquisadores_resp = client.get(
        f"/projetos/{projeto['id']}/pesquisadores",
        headers=_auth(coord),
    )
    assert pesquisadores_resp.status_code == 403, pesquisadores_resp.text

    solicitacao = SolicitacaoRH(
        identificador="SOL-001",
        projeto_id=projeto["id"],
        tipo=TipoSolicitacao.IMPLANTACAO,
        criado_por=servidor_alvo.id,
    )
    db_session.add(solicitacao)
    db_session.commit()
    db_session.refresh(solicitacao)

    solicitacoes_resp = client.get(
        f"/solicitacoes/?projeto_id={projeto['id']}",
        headers=_auth(coord),
    )
    assert solicitacoes_resp.status_code == 200, solicitacoes_resp.text
    assert solicitacoes_resp.json() == []

    solicitacao_detalhe_resp = client.get(
        f"/solicitacoes/{solicitacao.id}",
        headers=_auth(coord),
    )
    assert solicitacao_detalhe_resp.status_code == 403, solicitacao_detalhe_resp.text


def test_coordenador_sem_vinculo_nao_lista_nem_acessa_projeto_alocado_por_outro(
    client,
    db_session,
    coord,
    servidor_alvo,
):
    outro_coord = _make_usuario(
        db_session,
        PerfilUsuario.COORDENADOR,
        "777.777.777-77",
        "outro.coord@x.com",
    )
    payload = _payload_basico()
    payload["coordenador_ref_pesquisador"] = servidor_alvo.ref_usuario

    criar_resp = client.post("/projetos/", json=payload, headers=_auth(coord))
    assert criar_resp.status_code == 201, criar_resp.text
    projeto = criar_resp.json()

    listar_resp = client.get("/projetos/", headers=_auth(outro_coord))
    assert listar_resp.status_code == 200, listar_resp.text
    assert projeto["id"] not in [item["id"] for item in listar_resp.json()]

    detalhe_resp = client.get(f"/projetos/{projeto['id']}", headers=_auth(outro_coord))
    assert detalhe_resp.status_code == 403, detalhe_resp.text


def test_admin_cria_com_coordenador_externo_cria_usuario_interno(client, db_session, admin):
    payload = _payload_basico()
    payload["coordenador_ref_pesquisador"] = "555.555.555-55"
    payload["coordenador_nome_pesquisador"] = "Coordenador Externo"
    payload["coordenador_email_pesquisador"] = "coordenador.externo@ifpb.edu.br"

    resp = client.post("/projetos/", json=payload, headers=_auth(admin))
    assert resp.status_code == 201, resp.text
    body = resp.json()

    coordenador = (
        db_session.query(Usuario)
        .filter(Usuario.ref_usuario == payload["coordenador_ref_pesquisador"])
        .first()
    )
    assert coordenador is not None
    assert coordenador.id == body["coordenador_id"]
    assert coordenador.nome == payload["coordenador_nome_pesquisador"]
    assert coordenador.email == payload["coordenador_email_pesquisador"]
    assert coordenador.perfil == PerfilUsuario.COORDENADOR
    assert coordenador.ativo is True


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
    assert "nome" in detail.lower() or "nao informado" in detail.lower()


def test_admin_com_coordenador_externo_sem_email_retorna_400(client, admin):
    payload = _payload_basico()
    payload["coordenador_ref_pesquisador"] = "555.555.555-55"
    payload["coordenador_nome_pesquisador"] = "Coordenador Externo"

    resp = client.post("/projetos/", json=payload, headers=_auth(admin))
    assert resp.status_code == 400, resp.text
    detail = resp.json().get("detail", "")
    assert "email" in detail.lower()


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
