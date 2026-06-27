"""
Testes das melhorias de cálculo de bolsa, validação de CH global com
breakdown por projeto, conflito mesma-fonte e resumo do pesquisador.

Cobre as regras definidas em `openspec/changes/rh-implantacao-alteracao-melhorias/specs/`.
"""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.parametro_regra import ParametroRegra
from app.models.pesquisador_projeto import PesquisadorProjeto
from app.models.projeto import Projeto
from app.models.projeto_fonte_financiamento import ProjetoFonteFinanciamento
from app.models.solicitacao_rh import SolicitacaoRH
from app.models.usuario_perfil import Usuario
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.services.membro_service import MembroService
from app.services.parametro_service import ParametroService
from app.services.solicitacao_service import SolicitacaoService
from app.schemas.membro import MembroCreate
from app.schemas.solicitacao import SolicitacaoImplantacaoCreate
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
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def coordenador(db):
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
    hoje = date(2026, 1, 1)
    projeto = Projeto(
        codigo="PROJ-TESTE",
        titulo="Projeto de Teste",
        coordenador_id=coordenador.id,
        status=StatusProjeto.ATIVO,
        data_inicio=hoje,
        data_fim=hoje + timedelta(days=365),
    )
    db.add(projeto)
    db.flush()
    db.add(
        ProjetoFonteFinanciamento(
            projeto_id=projeto.id,
            fonte=FonteFinanciamento.EMPRESA,
            valor=1_000_000,
        )
    )
    db.commit()
    db.refresh(projeto)
    return projeto


@pytest.fixture
def projeto_b(db, coordenador):
    """Segundo projeto, usado para testar alocações em outros projetos."""
    hoje = date(2026, 1, 1)
    projeto = Projeto(
        codigo="PROJ-OTHER",
        titulo="Outro Projeto",
        coordenador_id=coordenador.id,
        status=StatusProjeto.ATIVO,
        data_inicio=hoje,
        data_fim=hoje + timedelta(days=365),
    )
    db.add(projeto)
    db.flush()
    db.add(
        ProjetoFonteFinanciamento(
            projeto_id=projeto.id,
            fonte=FonteFinanciamento.EMPRESA,
            valor=500_000,
        )
    )
    db.commit()
    db.refresh(projeto)
    return projeto


@pytest.fixture
def parametro_bolsa(db):
    """Parametro_Regra vigente para PESQUISADOR_JUNIOR: R$4.000 / 40h."""
    p = ParametroRegra(
        tipo_regra=TipoParametroRegra.VALOR_BOLSA,
        categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
        descricao="Bolsa PESQUISADOR_JUNIOR",
        valor_bolsa_referencia=4000.0,
        carga_horaria_referencia=40,
        vigencia_inicio=date(2020, 1, 1),
        vigencia_fim=None,
        ativo=True,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@pytest.fixture
def parametro_ch(db):
    """Limite CH semanal: 40h."""
    p = ParametroRegra(
        tipo_regra=TipoParametroRegra.LIMITE_CARGA_HORARIA,
        descricao="Limite CH semanal global",
        limite_carga_horaria_semanal=40,
        vigencia_inicio=date(2020, 1, 1),
        vigencia_fim=None,
        ativo=True,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@pytest.fixture
def solicitacao_implantacao(db, coordenador, projeto):
    """Solicitacao IMPLANTACAO em EM_EDICAO com versão PROPOSTA."""
    return _criar_solicitacao(db, coordenador, projeto, TipoSolicitacao.IMPLANTACAO)


@pytest.fixture
def solicitacao_alteracao(db, coordenador, projeto):
    """Solicitacao ALTERACAO em EM_EDICAO com versão PROPOSTA."""
    return _criar_solicitacao(db, coordenador, projeto, TipoSolicitacao.ALTERACAO)


def _criar_solicitacao(db, coordenador, projeto, tipo):
    solicitacao = SolicitacaoRH(
        identificador=f"{tipo.value}-001",
        projeto_id=projeto.id,
        tipo=tipo,
        status=StatusSolicitacao.EM_EDICAO,
        criado_por=coordenador.id,
    )
    db.add(solicitacao)
    db.flush()
    versao = VersaoRHProjeto(
        projeto_id=projeto.id,
        numero_versao=1,
        status=StatusVersaoRH.PROPOSTA,
        solicitacao_id=solicitacao.id,
    )
    db.add(versao)
    db.commit()
    db.refresh(solicitacao)
    return solicitacao


def _add_membro_vigente(db, projeto, ref, ch, fonte=FonteFinanciamento.EMPRESA):
    """Cria versão VIGENTE no projeto e adiciona membro nela."""
    versao = VersaoRHProjeto(
        projeto_id=projeto.id,
        numero_versao=99,
        status=StatusVersaoRH.VIGENTE,
    )
    db.add(versao)
    db.flush()
    membro = PesquisadorProjeto(
        ref_pesquisador=ref,
        nome_pesquisador=f"Pesquisador {ref}",
        versao_rh_id=versao.id,
        categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
        fonte_financiamento=fonte,
        carga_horaria_semanal=ch,
        valor_bolsa=2000.0,
        data_inicio=date(2026, 1, 1),
        data_fim=date(2026, 12, 31),
    )
    db.add(membro)
    db.commit()
    db.refresh(membro)
    return membro


# === 5.1 Cálculo de bolsa proporcional por período ===

def test_calcular_bolsa_mensal_sem_data_fim(db, parametro_bolsa):
    """Sem data_fim, valor_periodo == valor_mensal."""
    service = ParametroService(db)
    valor = service.calcular_valor_periodo(
        categoria=CategoriaBolsa.PESQUISADOR_JUNIOR,
        ch_semanal=20,
        data_inicio=date(2026, 3, 1),
        data_fim=None,
    )
    assert valor == 2000.0


def test_calcular_bolsa_proporcional_2_meses(db, parametro_bolsa):
    """data_inicio=2026-03-01, data_fim=2026-04-30 → 61 dias → ~2.033 meses × R$ 2.000."""
    service = ParametroService(db)
    valor = service.calcular_valor_periodo(
        categoria=CategoriaBolsa.PESQUISADOR_JUNIOR,
        ch_semanal=20,
        data_inicio=date(2026, 3, 1),
        data_fim=date(2026, 4, 30),
    )
    # 61 dias / 30 = 2.0333... * 2000 = 4066.67
    assert valor == Decimal("4066.67")


def test_calcular_bolsa_proporcional_4_meses(db, parametro_bolsa):
    """data_inicio=2026-03-01, data_fim=2026-06-30 → 122 dias → ~4.067 meses × R$ 2.000."""
    service = ParametroService(db)
    valor = service.calcular_valor_periodo(
        categoria=CategoriaBolsa.PESQUISADOR_JUNIOR,
        ch_semanal=20,
        data_inicio=date(2026, 3, 1),
        data_fim=date(2026, 6, 30),
    )
    # 122 dias / 30 = 4.0666... * 2000 = 8133.33
    assert valor == Decimal("8133.33")


def test_calcular_bolsa_rejeita_data_fim_menor_que_data_inicio(db, parametro_bolsa):
    service = ParametroService(db)
    with pytest.raises(HTTPException) as exc_info:
        service.calcular_valor_periodo(
            categoria=CategoriaBolsa.PESQUISADOR_JUNIOR,
            ch_semanal=20,
            data_inicio=date(2026, 4, 1),
            data_fim=date(2026, 3, 15),
        )
    assert exc_info.value.status_code == 400
    assert "data_fim" in str(exc_info.value.detail).lower()


def test_calcular_valor_hora_medio(db, parametro_bolsa):
    service = ParametroService(db)
    valor_hora = service.calcular_valor_hora(
        valor_bolsa_mensal=Decimal("2000.00"),
        ch_semanal=20,
    )
    assert valor_hora == Decimal("100.00")


def test_calcular_valor_hora_zero_quando_ch_zero(db):
    service = ParametroService(db)
    valor_hora = service.calcular_valor_hora(
        valor_bolsa_mensal=Decimal("2000.00"),
        ch_semanal=0,
    )
    assert valor_hora == Decimal("0.00")


# === 5.2 Breakdown de CH por projeto ===

def test_validar_ch_global_retorna_breakdown_por_projeto(
    db, parametro_bolsa, parametro_ch, projeto, projeto_b, coordenador
):
    """
    Pesquisador tem 30h em projeto A e propõe 20h em projeto B (limite 40h).
    Resultado: valido=false, alocacoes_concorrentes com 1 item de projeto A.
    """
    _add_membro_vigente(db, projeto, "ref-123", ch=30, fonte=FonteFinanciamento.EMPRESA)

    service = ParametroService(db)
    resultado = service.obter_validacao_ch_global(
        ref_pesquisador="ref-123",
        ch_nova=20,
        data_inicio_novo=date(2026, 3, 1),
        data_fim_novo=date(2026, 12, 31),
        projeto_id_excluir=projeto_b.id,
    )

    assert resultado["valido"] is False
    assert resultado["ch_total"] == 50
    assert resultado["limite_semanal"] == 40
    assert len(resultado["alocacoes_concorrentes"]) == 1
    conc = resultado["alocacoes_concorrentes"][0]
    assert conc["projeto_codigo"] == "PROJ-TESTE"
    assert conc["carga_horaria_semanal"] == 30
    assert conc["valor_hora_medio"] == pytest.approx(2000.0 / 30, rel=1e-2)


def test_validar_ch_global_mensagem_cita_projeto_e_valor_hora(
    db, parametro_bolsa, parametro_ch, projeto, projeto_b, coordenador
):
    _add_membro_vigente(db, projeto, "ref-456", ch=30, fonte=FonteFinanciamento.EMPRESA)
    service = ParametroService(db)
    resultado = service.obter_validacao_ch_global(
        ref_pesquisador="ref-456",
        ch_nova=20,
        data_inicio_novo=date(2026, 3, 1),
        data_fim_novo=date(2026, 12, 31),
        projeto_id_excluir=projeto_b.id,
    )
    assert "PROJ-TESTE" in resultado["mensagem"]
    assert "30h" in resultado["mensagem"]
    assert "R$" in resultado["mensagem"]


def test_validar_ch_global_throwing_mensagem_detalhada(
    db, parametro_bolsa, parametro_ch, projeto, projeto_b, coordenador
):
    """Versão throwing levanta HTTP 400 com mesmo detalhe."""
    _add_membro_vigente(db, projeto, "ref-789", ch=30, fonte=FonteFinanciamento.EMPRESA)
    service = ParametroService(db)
    with pytest.raises(HTTPException) as exc_info:
        service.validar_carga_horaria_global(
            ref_pesquisador="ref-789",
            ch_nova=20,
            data_inicio_novo=date(2026, 3, 1),
            data_fim_novo=date(2026, 12, 31),
            projeto_id_excluir=projeto_b.id,
        )
    assert exc_info.value.status_code == 400
    assert "PROJ-TESTE" in str(exc_info.value.detail)


# === 5.3 / 5.4 / 5.5 Conflito mesma fonte ===

def test_membro_service_rejeita_mesma_fonte_periodos_sobrepostos(
    db, parametro_bolsa, parametro_ch, projeto, coordenador, solicitacao_implantacao
):
    """
    Pesquisador já tem alocação EMBRAPII 01/03→30/06 em projeto.
    Tentar incluir outra EMBRAPII 15/05→15/08 sobreposta → 400.
    """
    # Alocação já existente em versão VIGENTE (criada direto no banco)
    versao_vigente = VersaoRHProjeto(
        projeto_id=projeto.id,
        numero_versao=99,
        status=StatusVersaoRH.VIGENTE,
    )
    db.add(versao_vigente)
    db.flush()
    db.add(
        PesquisadorProjeto(
            ref_pesquisador="ref-conflito",
            nome_pesquisador="Pesquisador Conflito",
            versao_rh_id=versao_vigente.id,
            categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
            fonte_financiamento=FonteFinanciamento.EMBRAPII,
            carga_horaria_semanal=10,
            valor_bolsa=1000.0,
            data_inicio=date(2026, 3, 1),
            data_fim=date(2026, 6, 30),
        )
    )
    db.commit()

    service = MembroService(db)
    dados = MembroCreate(
        ref_pesquisador="ref-conflito",
        nome_pesquisador="Pesquisador Conflito",
        categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
        fonte_financiamento=FonteFinanciamento.EMBRAPII,
        carga_horaria_semanal=10,
        data_inicio=date(2026, 5, 15),
        data_fim=date(2026, 8, 15),
    )
    with pytest.raises(HTTPException) as exc_info:
        service.incluir(solicitacao_implantacao.id, dados, current_user=coordenador)
    assert exc_info.value.status_code == 400
    assert "ref-conflito" in str(exc_info.value.detail)
    assert "EMBRAPII" in str(exc_info.value.detail)


def test_membro_service_permite_fontes_diferentes_mesmo_pesquisador(
    db, parametro_bolsa, parametro_ch, projeto, coordenador, solicitacao_implantacao
):
    """Mesma ref + EMBRAPII vigente + nova EMPRESA → OK."""
    versao_vigente = VersaoRHProjeto(
        projeto_id=projeto.id,
        numero_versao=99,
        status=StatusVersaoRH.VIGENTE,
    )
    db.add(versao_vigente)
    db.flush()
    db.add(
        PesquisadorProjeto(
            ref_pesquisador="ref-multi",
            nome_pesquisador="Pesquisador Multi",
            versao_rh_id=versao_vigente.id,
            categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
            fonte_financiamento=FonteFinanciamento.EMBRAPII,
            carga_horaria_semanal=10,
            valor_bolsa=1000.0,
            data_inicio=date(2026, 3, 1),
            data_fim=date(2026, 6, 30),
        )
    )
    db.commit()

    service = MembroService(db)
    dados = MembroCreate(
        ref_pesquisador="ref-multi",
        nome_pesquisador="Pesquisador Multi",
        categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
        fonte_financiamento=FonteFinanciamento.EMPRESA,
        carga_horaria_semanal=10,
        data_inicio=date(2026, 5, 15),
        data_fim=date(2026, 8, 15),
    )
    resp = service.incluir(solicitacao_implantacao.id, dados, current_user=coordenador)
    assert resp.ref_pesquisador == "ref-multi"
    assert resp.fonte_financiamento == FonteFinanciamento.EMPRESA


def test_membro_service_permite_mesma_fonte_periodos_disjuntos(
    db, parametro_bolsa, parametro_ch, projeto, coordenador, solicitacao_implantacao
):
    """Mesma ref + mesma fonte + períodos disjuntos → OK."""
    # Cria versão VIGENTE no projeto com alocação EMPRESA 01/03→30/06
    versao_vigente = VersaoRHProjeto(
        projeto_id=projeto.id,
        numero_versao=99,
        status=StatusVersaoRH.VIGENTE,
    )
    db.add(versao_vigente)
    db.flush()
    db.add(
        PesquisadorProjeto(
            ref_pesquisador="ref-disj",
            nome_pesquisador="Pesquisador Disjunto",
            versao_rh_id=versao_vigente.id,
            categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
            fonte_financiamento=FonteFinanciamento.EMPRESA,
            carga_horaria_semanal=10,
            valor_bolsa=1000.0,
            data_inicio=date(2026, 3, 1),
            data_fim=date(2026, 6, 30),
        )
    )
    db.commit()

    service = MembroService(db)
    dados = MembroCreate(
        ref_pesquisador="ref-disj",
        nome_pesquisador="Pesquisador Disjunto",
        categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
        fonte_financiamento=FonteFinanciamento.EMPRESA,
        carga_horaria_semanal=10,
        data_inicio=date(2026, 7, 1),
        data_fim=date(2026, 12, 31),
    )
    resp = service.incluir(solicitacao_implantacao.id, dados, current_user=coordenador)
    assert resp.id is not None


def test_membro_response_inclui_campos_derivados(
    db, parametro_bolsa, parametro_ch, projeto, coordenador, solicitacao_implantacao
):
    """MembroResponse expõe valor_bolsa_mensal, valor_bolsa_periodo, valor_hora_medio."""
    service = MembroService(db)
    dados = MembroCreate(
        ref_pesquisador="ref-resp",
        nome_pesquisador="Pesquisador Response",
        categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
        fonte_financiamento=FonteFinanciamento.EMPRESA,
        carga_horaria_semanal=20,
        data_inicio=date(2026, 3, 1),
        data_fim=date(2026, 4, 30),
    )
    resp = service.incluir(solicitacao_implantacao.id, dados, current_user=coordenador)
    # 20h × R$100/h = R$2.000 mensal; 61 dias / 30 = 2.0333 × R$2.000 = R$4.066,67
    assert float(resp.valor_bolsa) == 2000.0
    assert float(resp.valor_bolsa_mensal) == 2000.0
    assert float(resp.valor_bolsa_periodo) == 4066.67
    assert float(resp.valor_hora_medio) == 100.0


# === 5.6 Resumo do pesquisador ===

def test_resumo_pesquisador_agrega_alocacoes_vigentes(
    db, parametro_bolsa, parametro_ch, projeto, projeto_b, coordenador
):
    """
    Pesquisador com 2 alocações em 2 projetos (20h + 10h, ambas com valor_bolsa=R$2.000).
    Resumo: 2 projetos, 1 fonte (EMPRESA), 30h CH total, R$4.000 custo total.
    """
    _add_membro_vigente(db, projeto, "ref-resumo", ch=20)
    _add_membro_vigente(db, projeto_b, "ref-resumo", ch=10)

    service = ParametroService(db)
    resumo = service.resumir_pesquisador(ref_pesquisador="ref-resumo")

    assert resumo["ref_pesquisador"] == "ref-resumo"
    assert resumo["total_projetos"] == 2
    assert resumo["total_fontes"] == 1
    assert resumo["ch_total"] == 30
    # Cada membro tem valor_bolsa=R$2.000; 2 membros → R$4.000
    assert float(resumo["custo_total_mensal"]) == 4000.0
    assert resumo["valor_hora_medio_ponderado"] == pytest.approx(4000.0 / 30, rel=1e-2)


def test_resumo_pesquisador_filtrado_por_janela(
    db, parametro_bolsa, parametro_ch, projeto, coordenador
):
    """Janela abril/2026: inclui alocações que sobrepõem abril; exclui as demais."""
    _add_membro_vigente(db, projeto, "ref-janela", ch=20)

    service = ParametroService(db)
    resumo = service.resumir_pesquisador(
        ref_pesquisador="ref-janela",
        data_inicio=date(2026, 4, 1),
        data_fim=date(2026, 4, 30),
    )
    assert resumo["ch_total"] == 20


def test_resumo_pesquisador_sem_alocacoes(
    db, parametro_bolsa, parametro_ch, projeto, coordenador
):
    """Pesquisador sem alocações: agregados zerados."""
    service = ParametroService(db)
    resumo = service.resumir_pesquisador(ref_pesquisador="inexistente")
    assert resumo["alocacoes"] == []
    assert resumo["total_projetos"] == 0
    assert resumo["ch_total"] == 0
    assert float(resumo["custo_total_mensal"]) == 0.0


# === Validação de data_fim inválida em incluir ===

def test_incluir_rejeita_data_fim_menor_que_data_inicio(
    db, parametro_bolsa, parametro_ch, projeto, coordenador, solicitacao_implantacao
):
    service = MembroService(db)
    dados = MembroCreate(
        ref_pesquisador="ref-data",
        nome_pesquisador="Pesquisador Data",
        categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
        fonte_financiamento=FonteFinanciamento.EMPRESA,
        carga_horaria_semanal=10,
        data_inicio=date(2026, 4, 1),
        data_fim=date(2026, 3, 15),
    )
    with pytest.raises(HTTPException) as exc_info:
        service.incluir(solicitacao_implantacao.id, dados, current_user=coordenador)
    assert exc_info.value.status_code == 400


# === Regressão: GET /projetos/{id}/pesquisadores/vigentes retornava 500 ===
# (Pydantic ValidationError: MembroResponse exige valor_bolsa_mensal, valor_bolsa_periodo,
#  valor_hora_medio, mas VersaoService retornava o ORM bruto)


def test_versao_service_listar_vigentes_retorna_membro_response(
    db, parametro_bolsa, parametro_ch, projeto, coordenador
):
    """
    VersaoService.listar_pesquisadores_vigentes deve retornar MembroResponse
    com os três campos derivados preenchidos.
    """
    from app.services.versao_service import VersaoService

    _add_membro_vigente(db, projeto, "ref-vig", ch=20)
    service = VersaoService(db)
    itens, total = service.listar_pesquisadores_vigentes(projeto.id)

    assert total == 1
    assert len(itens) == 1
    m = itens[0]
    assert hasattr(m, "valor_bolsa_mensal")
    assert hasattr(m, "valor_bolsa_periodo")
    assert hasattr(m, "valor_hora_medio")
    assert float(m.valor_bolsa_mensal) == 2000.0
    # data_fim=2026-12-31, data_inicio=2026-01-01: 365 dias / 30 × R$2.000 = R$24.333,33
    assert float(m.valor_bolsa_periodo) == pytest.approx(24333.33, rel=1e-2)
    assert float(m.valor_hora_medio) == pytest.approx(100.0, rel=1e-2)


def test_versao_service_listar_corrente_retorna_membro_response(
    db, parametro_bolsa, parametro_ch, projeto, coordenador, solicitacao_alteracao
):
    """
    VersaoService.listar_pesquisadores_da_versao_corrente (PROPOSTA em rascunho)
    também deve retornar MembroResponse com campos derivados.
    """
    from app.services.versao_service import VersaoService

    service = VersaoService(db)
    membro_service = MembroService(db)
    membro_service.incluir(
        solicitacao_alteracao.id,
        MembroCreate(
            ref_pesquisador="ref-corr",
            nome_pesquisador="Pesquisador Corrente",
            categoria_bolsa=CategoriaBolsa.PESQUISADOR_JUNIOR,
            fonte_financiamento=FonteFinanciamento.EMPRESA,
            carga_horaria_semanal=20,
            data_inicio=date(2026, 3, 1),
            data_fim=date(2026, 4, 30),
        ),
        current_user=coordenador,
    )

    itens, total, is_rascunho = service.listar_pesquisadores_da_versao_corrente(projeto.id)
    assert total == 1
    assert len(itens) == 1
    assert is_rascunho is True
    m = itens[0]
    assert hasattr(m, "valor_bolsa_mensal")
    assert hasattr(m, "valor_bolsa_periodo")
    assert hasattr(m, "valor_hora_medio")
    assert float(m.valor_bolsa_mensal) == 2000.0
    assert float(m.valor_bolsa_periodo) == pytest.approx(4066.67, rel=1e-2)


def test_get_pesquisadores_vigentes_retorna_200_com_campos_derivados(
    db, parametro_bolsa, parametro_ch, projeto, coordenador
):
    """
    Regressão direta do bug original:
    GET /projetos/{id}/pesquisadores/vigentes?page=1&per_page=5 retornava 500
    com Pydantic ValidationError porque MembroResponse exigia os 3 campos derivados
    que o ORM não tem. Após o fix via build_membro_response, retorna 200.
    """
    from app.core.security import create_access_token
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.dependencies import get_db

    _add_membro_vigente(db, projeto, "ref-http", ch=20)

    def _override():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override
    token = create_access_token(
        {"sub": str(coordenador.id), "perfil": coordenador.perfil.value}
    )
    with TestClient(app) as c:
        resp = c.get(
            f"/projetos/{projeto.id}/pesquisadores/vigentes?page=1&per_page=5",
            headers={"Authorization": f"Bearer {token}"},
        )
    app.dependency_overrides.clear()

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "items" in body
    assert len(body["items"]) == 1
    m = body["items"][0]
    # Pydantic serializa Decimal como string em JSON; o FRONTEND converte.
    assert "valor_bolsa_mensal" in m
    assert "valor_bolsa_periodo" in m
    assert "valor_hora_medio" in m
    assert float(m["valor_bolsa_mensal"]) == 2000.0
    assert float(m["valor_bolsa_periodo"]) == pytest.approx(24333.33, rel=1e-2)
    assert float(m["valor_hora_medio"]) == pytest.approx(100.0, rel=1e-2)


def test_get_pesquisadores_corrente_retorna_200_com_campos_derivados(
    db, parametro_bolsa, parametro_ch, projeto, coordenador
):
    """
    Regressão do endpoint GET /projetos/{id}/pesquisadores (corrente/rascunho).
    Após o fix via build_membro_response, retorna 200 com campos derivados.
    """
    from app.core.security import create_access_token
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.dependencies import get_db

    _add_membro_vigente(db, projeto, "ref-corr-http", ch=20)

    def _override():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override
    token = create_access_token(
        {"sub": str(coordenador.id), "perfil": coordenador.perfil.value}
    )
    with TestClient(app) as c:
        resp = c.get(
            f"/projetos/{projeto.id}/pesquisadores?page=1&per_page=5",
            headers={"Authorization": f"Bearer {token}"},
        )
    app.dependency_overrides.clear()

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "items" in body
    m = body["items"][0]
    assert "valor_bolsa_mensal" in m
    assert "valor_bolsa_periodo" in m
    assert "valor_hora_medio" in m
    assert float(m["valor_bolsa_mensal"]) == 2000.0
