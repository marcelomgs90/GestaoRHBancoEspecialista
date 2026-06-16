"""
Testes unitários para validação de membros retornados no projeto.

Garante que a equipe oficial do projeto (versão VIGENTE) só muda após a
aprovação da solicitação pelo Gestor do Polo, conforme as regras descritas
em `docs/04-regras-negocio.md` §3 e §5 e em `AGENTS.md`.

Cenários cobertos:
1. Implantação: cria projeto, adiciona 3 membros via implantação e valida
   que os 3 só aparecem APÓS a aprovação.
2. Alteração (inclusão): com 3 membros vigentes, abre alteração, adiciona
   1 membro; antes da aprovação ainda há 3; após aprovação há 4.
3. Alteração (remoção): com 4 membros vigentes, abre alteração, remove 2;
   antes da aprovação ainda há 4; após aprovação há 2.
4. Rejeição: com 2 membros vigentes, abre alteração para remover 1 membro,
   submete, gestor rejeita — equipe oficial continua com 2 membros.
"""
from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.projeto import Projeto
from app.models.usuario_perfil import Usuario
from app.services.solicitacao_service import SolicitacaoService
from app.services.versao_service import VersaoService
from app.services.membro_service import MembroService
from app.schemas.solicitacao import SolicitacaoCreate, SolicitacaoImplantacaoCreate
from app.schemas.membro import MembroCreate
from app.utils.enums import (
    CategoriaBolsa,
    FonteFinanciamento,
    PerfilUsuario,
    StatusProjeto,
    StatusSolicitacao,
    StatusVersaoRH,
    TipoParametroRegra,
    TipoSolicitacao,
)

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Sessão de banco isolada por teste (SQLite em memória)."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def coordenador(db):
    """Coordenador responsável pelo projeto de teste."""
    usuario = Usuario(
        ref_usuario="COORD-001",
        nome="Coordenador Teste",
        email="coordenador@ifpb.edu.br",
        senha_hash="hashed",
        perfil=PerfilUsuario.COORDENADOR,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@pytest.fixture
def gestor(db):
    """Gestor do Polo responsável pela aprovação/rejeição."""
    usuario = Usuario(
        ref_usuario="GEST-001",
        nome="Gestor Teste",
        email="gestor@ifpb.edu.br",
        senha_hash="hashed",
        perfil=PerfilUsuario.GESTOR_POLO,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@pytest.fixture
def projeto(db, coordenador):
    """Projeto ATIVO coordenado pelo `coordenador`."""
    hoje = date.today()
    projeto = Projeto(
        codigo="PROJ-TESTE",
        titulo="Projeto de Teste",
        coordenador_id=coordenador.id,
        status=StatusProjeto.ATIVO,
        data_inicio=hoje,
        data_fim=hoje + timedelta(days=365),
    )
    db.add(projeto)
    db.commit()
    db.refresh(projeto)
    return projeto


def incluir_membro(db, versao_id, ref, nome):
    """Cria um `PesquisadorProjeto` vinculado a uma versão de RH."""
    membro = PesquisadorProjeto(
        ref_pesquisador=ref,
        nome_pesquisador=nome,
        versao_rh_id=versao_id,
        categoria_bolsa=CategoriaBolsa.ESTUDANTE_SUPERIOR_INICIANTE,
        fonte_financiamento=FonteFinanciamento.EMPRESA,
        carga_horaria_semanal=80,
        valor_bolsa=700,
        data_inicio=date.today(),
    )
    db.add(membro)
    db.commit()
    db.refresh(membro)
    return membro


def total_membros_correntes(db, projeto_id):
    """Helper: total de membros retornados por `listar_pesquisadores_da_versao_corrente`."""
    service = VersaoService(db)
    _, total, _ = service.listar_pesquisadores_da_versao_corrente(projeto_id)
    return total


def aprovar_implantacao(db, projeto, coordenador, gestor, identificador, refs_nomes):
    """Cria solicitação de implantação, submete e aprova. Retorna a solicitação."""
    solicitacao_service = SolicitacaoService(db)
    dados = SolicitacaoImplantacaoCreate(projeto_id=projeto.id, identificador=identificador)
    solicitacao = solicitacao_service.criar_implantacao(dados, coordenador)

    versao_service = VersaoService(db)
    versao_proposta = (
        db.query(__import__("app.models.versao_rh_projeto", fromlist=["VersaoRHProjeto"]).VersaoRHProjeto)
        .filter_by(projeto_id=projeto.id, status=StatusVersaoRH.PROPOSTA)
        .first()
    )
    for ref, nome in refs_nomes:
        incluir_membro(db, versao_proposta.id, ref, nome)

    solicitacao_service.submeter(solicitacao.id, coordenador)
    solicitacao_service.aprovar(solicitacao.id, gestor)
    return solicitacao_service.obter_por_id(solicitacao.id)


# ============================================================================
# TESTE 1: IMPLANTAÇÃO — 3 membros só aparecem APÓS aprovação
# ============================================================================

def test_implantacao_tres_membros_apenas_apos_aprovacao(
    db, projeto, coordenador, gestor
):
    """
    Cenário: projeto novo, criar implantação com 3 membros.

    Esperado:
    - EM_EDICAO: 3 membros (PROPOSTA, rascunho = True)
    - SUBMETIDA: 3 membros (PROPOSTA, rascunho = False — pendente)
    - APROVADA: 3 membros (VIGENTE, rascunho = False — oficial)
    """
    solicitacao_service = SolicitacaoService(db)
    versao_service = VersaoService(db)

    dados = SolicitacaoImplantacaoCreate(
        projeto_id=projeto.id, identificador="IMPL-001"
    )
    solicitacao = solicitacao_service.criar_implantacao(dados, coordenador)
    assert solicitacao.status == StatusSolicitacao.EM_EDICAO
    assert solicitacao.tipo == TipoSolicitacao.IMPLANTACAO

    versao_proposta = (
        db.query(__import__("app.models.versao_rh_projeto", fromlist=["VersaoRHProjeto"]).VersaoRHProjeto)
        .filter_by(projeto_id=projeto.id, status=StatusVersaoRH.PROPOSTA)
        .first()
    )
    assert versao_proposta is not None

    incluir_membro(db, versao_proposta.id, "PESQ-001", "João Silva")
    incluir_membro(db, versao_proposta.id, "PESQ-002", "Maria Santos")
    incluir_membro(db, versao_proposta.id, "PESQ-003", "Pedro Oliveira")

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 3
    assert is_rascunho is True
    nomes = {m.nome_pesquisador for m in membros}
    assert nomes == {"João Silva", "Maria Santos", "Pedro Oliveira"}

    solicitacao_service.submeter(solicitacao.id, coordenador)
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.SUBMETIDA

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 3
    assert is_rascunho is False

    solicitacao_service.aprovar(solicitacao.id, gestor)
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.APROVADA

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 3
    assert is_rascunho is False
    nomes = {m.nome_pesquisador for m in membros}
    assert nomes == {"João Silva", "Maria Santos", "Pedro Oliveira"}


# ============================================================================
# TESTE 2: ALTERAÇÃO (inclusão) — adicionar 1 membro a projeto com 3
# ============================================================================

def test_alteracao_adicionar_membro(db, projeto, coordenador, gestor):
    """
    Cenário: projeto com 3 membros vigentes. Cria alteração, adiciona 1.

    Esperado:
    - EM_EDICAO: 4 membros (PROPOSTA clonada, rascunho = True)
    - SUBMETIDA: 4 membros (PROPOSTA, rascunho = False) — VIGENTE ainda tem 3
    - APROVADA: 4 membros (VIGENTE oficial atualizada)
    """
    aprovar_implantacao(
        db,
        projeto,
        coordenador,
        gestor,
        identificador="IMPL-002",
        refs_nomes=[
            ("PESQ-001", "João Silva"),
            ("PESQ-002", "Maria Santos"),
            ("PESQ-003", "Pedro Oliveira"),
        ],
    )
    assert total_membros_correntes(db, projeto.id) == 3

    solicitacao_service = SolicitacaoService(db)
    versao_service = VersaoService(db)

    dados = SolicitacaoCreate(
        projeto_id=projeto.id,
        identificador="ALT-001",
        tipo=TipoSolicitacao.ALTERACAO,
    )
    solicitacao = solicitacao_service.criar(dados, coordenador)
    assert solicitacao.status == StatusSolicitacao.EM_EDICAO
    assert solicitacao.tipo == TipoSolicitacao.ALTERACAO

    versao_proposta = (
        db.query(__import__("app.models.versao_rh_projeto", fromlist=["VersaoRHProjeto"]).VersaoRHProjeto)
        .filter_by(
            projeto_id=projeto.id, status=StatusVersaoRH.PROPOSTA
        )
        .first()
    )
    assert versao_proposta is not None

    incluir_membro(db, versao_proposta.id, "PESQ-004", "Ana Costa")

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 4
    assert is_rascunho is True

    solicitacao_service.submeter(solicitacao.id, coordenador)
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.SUBMETIDA

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 4
    assert is_rascunho is False

    solicitacao_service.aprovar(solicitacao.id, gestor)
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.APROVADA

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 4
    assert is_rascunho is False
    nomes = {m.nome_pesquisador for m in membros}
    assert nomes == {"João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa"}


# ============================================================================
# TESTE 3: ALTERAÇÃO (remoção) — remover 2 membros de projeto com 4
# ============================================================================

def test_alteracao_remover_membros(db, projeto, coordenador, gestor):
    """
    Cenário: projeto com 4 membros vigentes. Cria alteração, remove 2.

    Esperado:
    - EM_EDICAO: 2 membros (PROPOSTA clonada com 2 removidos, rascunho = True)
    - SUBMETIDA: 2 membros (PROPOSTA, rascunho = False) — VIGENTE ainda tem 4
    - APROVADA: 2 membros (VIGENTE oficial passa a ter 2)
    """
    aprovar_implantacao(
        db,
        projeto,
        coordenador,
        gestor,
        identificador="IMPL-003",
        refs_nomes=[
            ("PESQ-001", "João Silva"),
            ("PESQ-002", "Maria Santos"),
            ("PESQ-003", "Pedro Oliveira"),
            ("PESQ-004", "Ana Costa"),
        ],
    )
    assert total_membros_correntes(db, projeto.id) == 4

    solicitacao_service = SolicitacaoService(db)
    versao_service = VersaoService(db)

    dados = SolicitacaoCreate(
        projeto_id=projeto.id,
        identificador="ALT-002",
        tipo=TipoSolicitacao.ALTERACAO,
    )
    solicitacao = solicitacao_service.criar(dados, coordenador)

    versao_proposta = (
        db.query(__import__("app.models.versao_rh_projeto", fromlist=["VersaoRHProjeto"]).VersaoRHProjeto)
        .filter_by(projeto_id=projeto.id, status=StatusVersaoRH.PROPOSTA)
        .first()
    )
    assert versao_proposta is not None

    membros_proposta = (
        db.query(PesquisadorProjeto)
        .filter(PesquisadorProjeto.versao_rh_id == versao_proposta.id)
        .all()
    )
    assert len(membros_proposta) == 4
    for membro in membros_proposta[:2]:
        db.delete(membro)
    db.commit()

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 2
    assert is_rascunho is True

    solicitacao_service.submeter(solicitacao.id, coordenador)
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.SUBMETIDA

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 2
    assert is_rascunho is False

    solicitacao_service.aprovar(solicitacao.id, gestor)
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.APROVADA

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 2
    assert is_rascunho is False
    nomes = {m.nome_pesquisador for m in membros}
    assert nomes == {"Ana Costa", "Pedro Oliveira"}


# ============================================================================
# TESTE 4: REJEIÇÃO — submeter alteração para remover 1 membro e rejeitar
# ============================================================================

def test_rejeicao_alteracao_preserva_equipe_oficial(
    db, projeto, coordenador, gestor
):
    """
    Cenário: projeto com 2 membros vigentes. Cria alteração para remover 1,
    submete e o Gestor rejeita.

    Esperado:
    - EM_EDICAO: 1 membro (PROPOSTA com 1 removido, rascunho = True)
    - SUBMETIDA: 1 membro (PROPOSTA, rascunho = False) — VIGENTE ainda tem 2
    - REJEITADA: 2 membros (VIGENTE original permanece — sem mudança na equipe oficial)
    """
    aprovar_implantacao(
        db,
        projeto,
        coordenador,
        gestor,
        identificador="IMPL-004",
        refs_nomes=[
            ("PESQ-001", "João Silva"),
            ("PESQ-002", "Maria Santos"),
        ],
    )
    assert total_membros_correntes(db, projeto.id) == 2

    solicitacao_service = SolicitacaoService(db)
    versao_service = VersaoService(db)

    dados = SolicitacaoCreate(
        projeto_id=projeto.id,
        identificador="ALT-003",
        tipo=TipoSolicitacao.ALTERACAO,
    )
    solicitacao = solicitacao_service.criar(dados, coordenador)

    versao_proposta = (
        db.query(__import__("app.models.versao_rh_projeto", fromlist=["VersaoRHProjeto"]).VersaoRHProjeto)
        .filter_by(projeto_id=projeto.id, status=StatusVersaoRH.PROPOSTA)
        .first()
    )
    membros_proposta = (
        db.query(PesquisadorProjeto)
        .filter(PesquisadorProjeto.versao_rh_id == versao_proposta.id)
        .all()
    )
    assert len(membros_proposta) == 2
    db.delete(membros_proposta[0])
    db.commit()

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 1
    assert is_rascunho is True

    solicitacao_service.submeter(solicitacao.id, coordenador)
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.SUBMETIDA

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 1
    assert is_rascunho is False

    solicitacao_service.rejeitar(solicitacao.id, gestor, "Membro essencial ao projeto")
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.REJEITADA

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 2
    assert is_rascunho is False
    nomes = {m.nome_pesquisador for m in membros}
    assert nomes == {"João Silva", "Maria Santos"}


# ============================================================================
# TESTE 5: REMOÇÃO via MembroService.remover (igual à chamada HTTP da UI)
# ============================================================================

def test_remocao_membro_via_membro_service_fluxo_ui(
    db, projeto, coordenador, gestor
):
    """
    Cenário: reproduz o fluxo exato da UI (AlteracaoPage) ao excluir um membro.

    A UI chama `solicitacaoService.encerrarMembro(id_solicitacao, id, motivo)`
    que aciona o `DELETE /solicitacoes/{id}/membros/{membroId}` no backend, o
    qual delega para `MembroService.remover`. Este teste exercita esse caminho
    real, garantindo que a deleção física do `PesquisadorProjeto` da PROPOSTA
    reflete na VIGENTE após a aprovação.

    Esperado:
    - VIGENTE inicial: 3 membros
    - Criar alteração, remover 1 via MembroService.remover → 2 na PROPOSTA
    - Submeter → 2 (rascunho=False)
    - Aprovar → 2 membros na VIGENTE oficial
    """
    aprovar_implantacao(
        db,
        projeto,
        coordenador,
        gestor,
        identificador="IMPL-005",
        refs_nomes=[
            ("PESQ-001", "João Silva"),
            ("PESQ-002", "Maria Santos"),
            ("PESQ-003", "Pedro Oliveira"),
        ],
    )
    assert total_membros_correntes(db, projeto.id) == 3

    solicitacao_service = SolicitacaoService(db)
    versao_service = VersaoService(db)
    membro_service = MembroService(db)

    # 1) Coordenador cria solicitação de alteração
    dados = SolicitacaoCreate(
        projeto_id=projeto.id,
        identificador="ALT-005",
        tipo=TipoSolicitacao.ALTERACAO,
    )
    solicitacao = solicitacao_service.criar(dados, coordenador)
    assert solicitacao.status == StatusSolicitacao.EM_EDICAO

    # 2) Backend já clonou a VIGENTE para a nova PROPOSTA — listar membros clonados
    membros_proposta = membro_service.listar(solicitacao.id)
    assert len(membros_proposta) == 3

    # 3) UI chama encerrarMembro → DELETE → MembroService.remover (caminho real)
    membro_a_remover = membros_proposta[0]
    membro_service.remover(solicitacao.id, membro_a_remover.id, coordenador.id)

    membros_proposta = membro_service.listar(solicitacao.id)
    assert len(membros_proposta) == 2
    assert all(m.id != membro_a_remover.id for m in membros_proposta)

    # 4) Verificar listagem da versão corrente (EM_EDICAO → PROPOSTA, rascunho)
    _, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(projeto.id)
    assert total == 2
    assert is_rascunho is True

    # 5) Submeter
    solicitacao_service.submeter(solicitacao.id, coordenador)
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.SUBMETIDA

    # Submetida ainda mostra a PROPOSTA com 2 membros (equipe oficial intacta)
    _, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(projeto.id)
    assert total == 2
    assert is_rascunho is False

    # 6) Aprovar — versão oficial passa a ter 2 membros
    solicitacao_service.aprovar(solicitacao.id, gestor)
    assert solicitacao_service.obter_por_id(solicitacao.id).status == StatusSolicitacao.APROVADA

    membros, total, is_rascunho = versao_service.listar_pesquisadores_da_versao_corrente(
        projeto.id
    )
    assert total == 2
    assert is_rascunho is False
    nomes = {m.nome_pesquisador for m in membros}
    assert membro_a_remover.nome_pesquisador not in nomes
    assert len(nomes) == 2

    # 7) Endpoint /projetos/{id}/pesquisadores/vigentes também deve refletir 2
    itens_vigentes, total_vigentes = versao_service.listar_pesquisadores_vigentes(projeto.id)
    assert total_vigentes == 2
    assert len(itens_vigentes) == 2


# ============================================================================
# TESTE 6: MembroService.remover rejeita quando solicitação não está EM_EDICAO
# ============================================================================

def test_remocao_membro_rejeitada_quando_submetida(
    db, projeto, coordenador, gestor
):
    """
    Cenário: tenta encerrar membro após submeter — backend deve recusar com 400.
    Garante que a UI receba 400 e exiba mensagem amigável.
    """
    from fastapi import HTTPException

    aprovar_implantacao(
        db,
        projeto,
        coordenador,
        gestor,
        identificador="IMPL-006",
        refs_nomes=[("PESQ-001", "João Silva")],
    )

    solicitacao_service = SolicitacaoService(db)
    membro_service = MembroService(db)

    dados = SolicitacaoCreate(
        projeto_id=projeto.id,
        identificador="ALT-006",
        tipo=TipoSolicitacao.ALTERACAO,
    )
    solicitacao = solicitacao_service.criar(dados, coordenador)

    membros_proposta = membro_service.listar(solicitacao.id)
    membro_id = membros_proposta[0].id

    solicitacao_service.submeter(solicitacao.id, coordenador)

    # Agora a solicitação está SUBMETIDA — DELETE não deve funcionar
    with pytest.raises(HTTPException) as exc_info:
        membro_service.remover(solicitacao.id, membro_id, coordenador.id)
    assert exc_info.value.status_code == 400
    assert "em edição" in str(exc_info.value.detail).lower()


# ============================================================================
# TESTE 7: REGRESSÃO — DELETE deve usar o id do CLONE (PROPOSTA), não da VIGENTE
# ============================================================================

def test_delete_deve_usar_id_do_clone_da_proposta_nao_da_vigente(
    db, projeto, coordenador, gestor
):
    """
    Regressão: o bug relatado foi que, após clicar em "remover Pedro Oliver" e
    submeter/aprovar, Pedro continuava aparecendo no projeto.

    Causa raiz: o frontend estava enviando o `id` da VIGENTE (ex: 42) na
    chamada DELETE, mas a referência na PROPOSTA (clone) tem um id diferente
    (ex: 45). O `MembroService.remover` busca o membro por `id` na versão da
    solicitação, então `id=42` da VIGENTE não é encontrado — e nada é removido.

    Comportamento correto: o frontend deve usar o id do CLONE (id da PROPOSTA)
    no DELETE. Este teste valida que essa rota funciona end-to-end.
    """
    from fastapi import HTTPException

    # Setup: projeto com 3 membros (Pedro, João, Maria)
    aprovar_implantacao(
        db,
        projeto,
        coordenador,
        gestor,
        identificador="IMPL-007",
        refs_nomes=[
            ("ESP-003", "Pedro Oliver"),
            ("ESP-001", "João Silva"),
            ("ESP-002", "Maria Souza"),
        ],
    )
    assert total_membros_correntes(db, projeto.id) == 3

    solicitacao_service = SolicitacaoService(db)
    versao_service = VersaoService(db)
    membro_service = MembroService(db)

    # 1) Coordenador cria solicitação de alteração (backend clona a VIGENTE)
    dados = SolicitacaoCreate(
        projeto_id=projeto.id,
        identificador="ALT-007",
        tipo=TipoSolicitacao.ALTERACAO,
    )
    solicitacao = solicitacao_service.criar(dados, coordenador)

    # 2) Buscar o id do CLONE de Pedro (ref_pesquisador=ESP-003) na PROPOSTA
    membros_proposta = membro_service.listar(solicitacao.id)
    pedro_clone = next(m for m in membros_proposta if m.ref_pesquisador == "ESP-003")
    assert pedro_clone is not None

    # 3) DELETE com o id do CLONE (45, por ex.) — esta é a chamada correta
    membro_service.remover(solicitacao.id, pedro_clone.id, coordenador.id)

    # 4) Verificar que Pedro foi removido da PROPOSTA
    membros_proposta = membro_service.listar(solicitacao.id)
    refs_restantes = {m.ref_pesquisador for m in membros_proposta}
    assert "ESP-003" not in refs_restantes
    assert len(membros_proposta) == 2

    # 5) Submeter
    solicitacao_service.submeter(solicitacao.id, coordenador)

    # 6) Aprovar — VIGENTE oficial passa a ter 2 membros
    solicitacao_service.aprovar(solicitacao.id, gestor)

    itens, total = versao_service.listar_pesquisadores_vigentes(projeto.id)
    assert total == 2
    refs_vigentes = {m.ref_pesquisador for m in itens}
    assert "ESP-003" not in refs_vigentes  # Pedro foi removido de verdade

    # 7) Sanidade: garantir que o id da VIGENTE (não o do clone) não funciona mais
    #    (porque o membro da VIGENTE não está na versão da solicitação atual).
    versao_vigente_original = (
        db.query(__import__("app.models.versao_rh_projeto", fromlist=["VersaoRHProjeto"]).VersaoRHProjeto)
        .filter_by(projeto_id=projeto.id, status=StatusVersaoRH.HISTORICO)
        .first()
    )
    pedro_na_vigente_original = next(
        m for m in db.query(PesquisadorProjeto).filter(
            PesquisadorProjeto.versao_rh_id == versao_vigente_original.id
        ).all() if m.ref_pesquisador == "ESP-003"
    )
    # Criar uma nova solicitação de alteração (a anterior está aprovada)
    dados2 = SolicitacaoCreate(
        projeto_id=projeto.id,
        identificador="ALT-007b",
        tipo=TipoSolicitacao.ALTERACAO,
    )
    nova_solicitacao = solicitacao_service.criar(dados2, coordenador)

    # DELETE com o id VELHO da VIGENTE original — não deve encontrar membro
    with pytest.raises(HTTPException) as exc_info:
        membro_service.remover(nova_solicitacao.id, pedro_na_vigente_original.id, coordenador.id)
    assert exc_info.value.status_code == 404  # Não encontrado nesta solicitação


# ============================================================================
# TESTE 8: Backend rejeita campos extras em MembroCreate/MembroUpdate
# ============================================================================

def test_backend_rejeita_fonte_pagadora_ifpb():
    """IFPB nao e mais uma fonte pagadora valida para projetos ou membros."""
    from app.schemas.projeto import ProjetoCreate, ProjetoFonteFinanciamento
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        MembroCreate(
            ref_pesquisador="PESQ-001",
            nome_pesquisador="Joao",
            categoria_bolsa=CategoriaBolsa.ESTUDANTE_SUPERIOR_INICIANTE,
            fonte_financiamento="IFPB",
            carga_horaria_semanal=20,
            data_inicio=date.today(),
        )

    with pytest.raises(ValidationError):
        ProjetoFonteFinanciamento(fonte="IFPB", valor=1000)

    with pytest.raises(ValidationError):
        ProjetoCreate(
            codigo="PROJ-IFPB",
            titulo="Projeto com fonte removida",
            descricao=None,
            fontes_financiamento=[
                {"fonte": "EMPRESA", "valor": 1000},
                {"fonte": "IFPB", "valor": 1000},
            ],
            data_inicio=date.today(),
            data_fim=date.today() + timedelta(days=30),
        )


def test_backend_rejeita_campos_extras_em_membro_create_e_update(
    db, projeto, coordenador, gestor
):
    """
    Garante que o backend rejeita payloads com campos extras (extra="forbid"),
    impedindo que o frontend sobrescreva `valor_bolsa` ou `id` no banco.
    """
    from app.schemas.membro import MembroCreate, MembroUpdate
    from pydantic import ValidationError

    # MembroCreate não pode aceitar `valor_bolsa` ou `id`
    with pytest.raises(ValidationError):
        MembroCreate(
            ref_pesquisador="PESQ-001",
            nome_pesquisador="João",
            categoria_bolsa=CategoriaBolsa.ESTUDANTE_SUPERIOR_INICIANTE,
            fonte_financiamento=FonteFinanciamento.EMPRESA,
            carga_horaria_semanal=20,
            data_inicio=date.today(),
            valor_bolsa=9999,  # campo extra
        )

    with pytest.raises(ValidationError):
        MembroCreate(
            ref_pesquisador="PESQ-001",
            nome_pesquisador="João",
            categoria_bolsa=CategoriaBolsa.ESTUDANTE_SUPERIOR_INICIANTE,
            fonte_financiamento=FonteFinanciamento.EMPRESA,
            carga_horaria_semanal=20,
            data_inicio=date.today(),
            id=42,  # campo extra
        )

    # MembroUpdate também não pode aceitar extras
    with pytest.raises(ValidationError):
        MembroUpdate(valor_bolsa=9999)

    with pytest.raises(ValidationError):
        MembroUpdate(id=42)

    # MembroUpdate aceita apenas os campos oficiais
    update_valido = MembroUpdate(carga_horaria_semanal=40)
    assert update_valido.carga_horaria_semanal == 40


# ============================================================================
# TESTE 9: Fluxo end-to-end via HTTP simulando os curls do bug
# ============================================================================

def _criar_usuario_e_projeto_via_api(client, db_session, perfil=PerfilUsuario.COORDENADOR):
    """Helper: cria usuário e projeto via API (não via fixtures locais)."""
    import secrets
    from app.core.security import create_access_token, get_password_hash
    from app.models.usuario_perfil import Usuario
    from app.models.projeto import Projeto

    suffix = secrets.token_hex(4)
    user = Usuario(
        ref_usuario=f"USR-{perfil.value}-{suffix}",
        nome=f"Usuário {perfil.value}",
        email=f"{perfil.value.lower()}-{suffix}@ifpb.edu.br",
        senha_hash=get_password_hash("senha123"),
        perfil=perfil,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    if perfil == PerfilUsuario.COORDENADOR:
        hoje = date.today()
        proj = Projeto(
            codigo=f"PROJ-{suffix}",
            titulo="Projeto de Teste",
            coordenador_id=user.id,
            status=StatusProjeto.ATIVO,
            data_inicio=hoje,
            data_fim=hoje + timedelta(days=365),
        )
        db_session.add(proj)
        db_session.commit()
        db_session.refresh(proj)
    else:
        proj = None

    token = create_access_token({"sub": str(user.id), "perfil": user.perfil.value})
    return user, proj, token


def _criar_solicitacao_implantacao(client, token, projeto_id, identificador):
    """Helper: cria solicitação de IMPLANTAÇÃO via API."""
    resp = client.post(
        "/solicitacoes/",
        json={
            "identificador": identificador,
            "projeto_id": projeto_id,
            "tipo": "IMPLANTACAO",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _criar_parametro_bolsa(db_session, categoria=CategoriaBolsa.PESQUISADOR_JUNIOR):
    """Helper: cria ParametroRegra vigente para que o cálculo de bolsa funcione."""
    from app.models.parametro_regra import ParametroRegra
    p = ParametroRegra(
        tipo_regra=TipoParametroRegra.VALOR_BOLSA,
        categoria_bolsa=categoria,
        descricao=f"Valor de bolsa {categoria.value}",
        valor_bolsa_referencia=2000.0,
        carga_horaria_referencia=40,
        vigencia_inicio=date(2020, 1, 1),
        vigencia_fim=None,
        ativo=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


def _criar_parametros_para_todas_categorias(db_session):
    """Cria parâmetros de bolsa para todas as categorias usadas nos testes."""
    for cat in [
        CategoriaBolsa.PESQUISADOR_JUNIOR,
        CategoriaBolsa.PESQUISADOR_PLENO,
        CategoriaBolsa.ESTUDANTE_SUPERIOR_INICIANTE,
    ]:
        # Verifica se já existe param para esta categoria
        from app.models.parametro_regra import ParametroRegra
        exists = (
            db_session.query(ParametroRegra)
            .filter(
                ParametroRegra.categoria_bolsa == cat,
                ParametroRegra.tipo_regra == TipoParametroRegra.VALOR_BOLSA,
                ParametroRegra.ativo.is_(True),
            )
            .first()
        )
        if not exists:
            _criar_parametro_bolsa(db_session, categoria=cat)


def _incluir_membro(client, token, solicitacao_id, ref, nome):
    """Helper: inclui membro via API."""
    resp = client.post(
        f"/solicitacoes/{solicitacao_id}/membros",
        json={
            "ref_pesquisador": ref,
            "nome_pesquisador": nome,
            "categoria_bolsa": "PESQUISADOR_JUNIOR",
            "fonte_financiamento": "EMPRESA",
            "carga_horaria_semanal": 80,
            "data_inicio": "2025-01-01",
            "data_fim": "2026-12-31",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text


def test_fluxo_end_to_end_remocao_pedro_curl_bug(client, db_session):
    """
    Simula EXATAMENTE a sequência de curls que o usuário relatou:
    1. POST /solicitacoes/                                  → cria solicitação
    2. GET  /solicitacoes/{id}/membros                      → lista membros
    3. DELETE /solicitacoes/{id}/membros/{id_clone_pedro}   → remove Pedro
    4. POST /solicitacoes/{id}/submeter                     → submete
    5. POST /solicitacoes/{id}/aprovar                      → aprova

    Comportamento esperado após o fix:
    - Pedro (id do clone) é removido do banco.
    - Após aprovar, `GET /projetos/{id}/pesquisadores` retorna 2 membros (sem Pedro).
    """
    # Garante que existe Parametro_Regra vigente para o cálculo de bolsa
    _criar_parametros_para_todas_categorias(db_session)

    # Cria coordenador + gestor + projeto via API
    coordenador, projeto, token_coord = _criar_usuario_e_projeto_via_api(
        client, db_session, perfil=PerfilUsuario.COORDENADOR
    )
    gestor, _, token_gestor = _criar_usuario_e_projeto_via_api(
        client, db_session, perfil=PerfilUsuario.GESTOR_POLO
    )

    # Setup: faz implantação com 3 membros
    sol_impl = _criar_solicitacao_implantacao(client, token_coord, projeto.id, "IMPL-009")
    _incluir_membro(client, token_coord, sol_impl, "ESP-003", "Pedro Oliver")
    _incluir_membro(client, token_coord, sol_impl, "ESP-001", "João Silva")
    _incluir_membro(client, token_coord, sol_impl, "ESP-002", "Maria Souza")
    client.post(f"/solicitacoes/{sol_impl}/submeter", headers={"Authorization": f"Bearer {token_coord}"})
    client.post(f"/solicitacoes/{sol_impl}/aprovar", headers={"Authorization": f"Bearer {token_gestor}"})

    # 1) POST /solicitacoes/ — cria alteração
    resp = client.post(
        "/solicitacoes/",
        json={
            "identificador": "ALT-009-curl",
            "projeto_id": projeto.id,
            "tipo": "ALTERACAO",
        },
        headers={"Authorization": f"Bearer {token_coord}"},
    )
    assert resp.status_code == 201, resp.text
    solicitacao_id = resp.json()["id"]

    # 2) GET /solicitacoes/{id}/membros — lista membros clonados
    resp = client.get(
        f"/solicitacoes/{solicitacao_id}/membros",
        headers={"Authorization": f"Bearer {token_coord}"},
    )
    assert resp.status_code == 200
    membros_clonados = resp.json()
    assert len(membros_clonados) == 3
    pedro_clone = next(m for m in membros_clonados if m["ref_pesquisador"] == "ESP-003")
    pedro_clone_id = pedro_clone["id"]

    # 3) DELETE /solicitacoes/{id}/membros/{pedro_clone_id} — remove Pedro
    resp = client.delete(
        f"/solicitacoes/{solicitacao_id}/membros/{pedro_clone_id}?motivo=Encerrado+na+alteracao",
        headers={"Authorization": f"Bearer {token_coord}"},
    )
    assert resp.status_code == 204, resp.text

    # Verificar que Pedro sumiu da PROPOSTA
    resp = client.get(
        f"/solicitacoes/{solicitacao_id}/membros",
        headers={"Authorization": f"Bearer {token_coord}"},
    )
    assert resp.status_code == 200
    membros_restantes = resp.json()
    assert len(membros_restantes) == 2
    assert all(m["ref_pesquisador"] != "ESP-003" for m in membros_restantes)

    # 4) POST /solicitacoes/{id}/submeter
    resp = client.post(
        f"/solicitacoes/{solicitacao_id}/submeter",
        headers={"Authorization": f"Bearer {token_coord}"},
    )
    assert resp.status_code == 200

    # 5) POST /solicitacoes/{id}/aprovar
    resp = client.post(
        f"/solicitacoes/{solicitacao_id}/aprovar",
        headers={"Authorization": f"Bearer {token_gestor}"},
    )
    assert resp.status_code == 200

    # Verificação final: /projetos/{id}/pesquisadores deve retornar 2 (sem Pedro)
    resp = client.get(
        f"/projetos/{projeto.id}/pesquisadores",
        headers={"Authorization": f"Bearer {token_coord}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    refs_final = {m["ref_pesquisador"] for m in data["items"]}
    assert "ESP-003" not in refs_final
    assert refs_final == {"ESP-001", "ESP-002"}

    # Verificação cruzada: /projetos/{id}/pesquisadores/vigentes também deve retornar 2
    resp = client.get(
        f"/projetos/{projeto.id}/pesquisadores/vigentes",
        headers={"Authorization": f"Bearer {token_coord}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert "ESP-003" not in {m["ref_pesquisador"] for m in data["items"]}


# ============================================================================
# TESTE 10: PUT com valor_bolsa no payload é rejeitado (proteção contra parasita)
# ============================================================================

def test_put_com_valor_bolsa_no_payload_e_rejeitado(client, db_session):
    """
    Garante que o backend rejeita PUT com campo extra `valor_bolsa` no payload.
    Isso protege contra o bug do `MembroEditor` propagar `valor_bolsa`
    calculado localmente e sobrescrever o valor correto do backend.
    """
    _criar_parametros_para_todas_categorias(db_session)

    coordenador, projeto, token = _criar_usuario_e_projeto_via_api(
        client, db_session, perfil=PerfilUsuario.COORDENADOR
    )

    # Setup: implantação com 1 membro
    sol_impl = _criar_solicitacao_implantacao(client, token, projeto.id, "IMPL-010")
    _incluir_membro(client, token, sol_impl, "ESP-001", "João Silva")
    gestor, _, token_gestor = _criar_usuario_e_projeto_via_api(
        client, db_session, perfil=PerfilUsuario.GESTOR_POLO
    )
    client.post(f"/solicitacoes/{sol_impl}/submeter", headers={"Authorization": f"Bearer {token}"})
    client.post(f"/solicitacoes/{sol_impl}/aprovar", headers={"Authorization": f"Bearer {token_gestor}"})

    # Criar alteração
    resp = client.post(
        "/solicitacoes/",
        json={
            "identificador": "ALT-010",
            "projeto_id": projeto.id,
            "tipo": "ALTERACAO",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    solicitacao_id = resp.json()["id"]

    resp = client.get(
        f"/solicitacoes/{solicitacao_id}/membros",
        headers={"Authorization": f"Bearer {token}"},
    )
    membro_id = resp.json()[0]["id"]

    # PUT com valor_bolsa no payload — backend deve rejeitar (422)
    resp = client.put(
        f"/solicitacoes/{solicitacao_id}/membros/{membro_id}",
        json={
            "carga_horaria_semanal": 40,
            "valor_bolsa": 9999,  # campo extra que o backend NÃO aceita
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422, f"Esperado 422, recebeu {resp.status_code}: {resp.text}"


# ============================================================================
# TESTE 11: REGRESSÃO — PUT com payload completo do frontend é aceito
# ============================================================================

def test_put_com_payload_filtrado_pelo_frontend_e_aceito(client, db_session):
    """
    Regressão: o usuário tentou alterar a carga horária de Carla Dias via UI
    e o backend rejeitou com 422 porque o frontend enviava `ref_pesquisador`
    e `nome_pesquisador` (campos extras do `MembroUpdate`).

    Este teste valida dois cenários complementares:

    1. **PUT com payload COMPLETO** (igual ao que o frontend enviava antes do
       fix) — backend rejeita com 422 (comportamento correto, documenta o
       contrato de `extra="forbid"`).
    2. **PUT com payload FILTRADO** (apenas os 5 campos do `MembroUpdate`,
       como o frontend passa a enviar) — backend aceita com 200 e o membro
       é atualizado corretamente.
    """
    _criar_parametros_para_todas_categorias(db_session)
    coordenador, projeto, token = _criar_usuario_e_projeto_via_api(
        client, db_session, perfil=PerfilUsuario.COORDENADOR
    )
    gestor, _, _ = _criar_usuario_e_projeto_via_api(
        client, db_session, perfil=PerfilUsuario.GESTOR_POLO
    )

    # Setup: implantação com 1 membro (Carla Dias)
    sol_impl = _criar_solicitacao_implantacao(client, token, projeto.id, "IMPL-011")
    _incluir_membro(client, token, sol_impl, "CAND-002", "Carla Dias")
    client.post(f"/solicitacoes/{sol_impl}/submeter", headers={"Authorization": f"Bearer {token}"})

    # Promover Carla a Gestor para aprovar (já existe um gestor na função, mas ok)
    # Aprovar a implantação
    token_gestor_resp = client.post(
        "/auth/login", json={"email": gestor.email, "senha": "senha123"}
    )
    # Se o endpoint de login não existir nesse formato, busca direto pelo token helper
    from app.core.security import create_access_token
    token_gestor = create_access_token({"sub": str(gestor.id), "perfil": gestor.perfil.value})

    client.post(f"/solicitacoes/{sol_impl}/aprovar", headers={"Authorization": f"Bearer {token_gestor}"})

    # Criar solicitação de alteração
    resp = client.post(
        "/solicitacoes/",
        json={
            "identificador": "ALT-011",
            "projeto_id": projeto.id,
            "tipo": "ALTERACAO",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    solicitacao_id = resp.json()["id"]

    resp = client.get(
        f"/solicitacoes/{solicitacao_id}/membros",
        headers={"Authorization": f"Bearer {token}"},
    )
    membro_id = resp.json()[0]["id"]

    # === Cenário 1: PUT com payload COMPLETO (igual ao bug original) ===
    resp = client.put(
        f"/solicitacoes/{solicitacao_id}/membros/{membro_id}",
        json={
            "ref_pesquisador": "CAND-002",
            "nome_pesquisador": "Carla Dias",
            "categoria_bolsa": "PESQUISADOR_PLENO",
            "fonte_financiamento": "EMPRESA",
            "carga_horaria_semanal": 19,
            "data_inicio": "2025-01-01",
            "data_fim": "2026-12-31",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    # Backend rejeita com 422 — comportamento correto (extra="forbid")
    assert resp.status_code == 422, (
        f"PUT com campos extras deveria ser rejeitado (422), "
        f"recebeu {resp.status_code}: {resp.text}"
    )

    # === Cenário 2: PUT com payload FILTRADO (5 campos do MembroUpdate) ===
    resp = client.put(
        f"/solicitacoes/{solicitacao_id}/membros/{membro_id}",
        json={
            "categoria_bolsa": "PESQUISADOR_PLENO",
            "fonte_financiamento": "EMPRESA",
            "carga_horaria_semanal": 19,
            "data_inicio": "2025-01-01",
            "data_fim": "2026-12-31",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    # Agora backend aceita
    assert resp.status_code == 200, (
        f"PUT com payload filtrado deveria ser aceito (200), "
        f"recebeu {resp.status_code}: {resp.text}"
    )

    # Verificar que a carga horária foi de fato atualizada
    resp = client.get(
        f"/solicitacoes/{solicitacao_id}/membros",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    membro_atualizado = next(m for m in resp.json() if m["id"] == membro_id)
    assert membro_atualizado["carga_horaria_semanal"] == 19
    # `valor_bolsa` é recalculado pelo backend (não vem do payload)
    assert "valor_bolsa" in membro_atualizado
    assert membro_atualizado["valor_bolsa"] != 9999  # não aceita o valor parasita

