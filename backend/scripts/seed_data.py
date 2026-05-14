"""
Script para popular banco de dados com dados mockados para desenvolvimento.
Conforme US-AQ-02: 2 usuarios, 1 projeto, 3 parametros, 3 pesquisadores simulados.
"""
import sys
import os
from datetime import date, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.usuario_perfil import Usuario, Perfil
from app.models.parametro_regra import ParametroRegra
from app.models.projeto import Projeto
from app.models.versao_rh_projeto import VersaoRHProjeto
from app.models.pesquisador_projeto import PesquisadorProjeto
from app.utils.enums import (
    PerfilUsuario, TipoParametroRegra, CategoriaBolsa,
    StatusProjeto, StatusVersaoRH, FonteFinanciamento
)


def criar_perfis(db: Session):
    """Criar perfis de usuario."""
    perfis = [
        Perfil(codigo=PerfilUsuario.ADMINISTRADOR, descricao="Administrador do sistema"),
        Perfil(codigo=PerfilUsuario.COORDENADOR, descricao="Coordenador de projeto"),
        Perfil(codigo=PerfilUsuario.GESTOR_POLO, descricao="Gestor do Polo de Inovacao"),
        Perfil(codigo=PerfilUsuario.APOIO_COORDENADOR, descricao="Apoio ao Coordenador"),
    ]

    for perfil in perfis:
        existente = db.query(Perfil).filter(Perfil.codigo == perfil.codigo).first()
        if not existente:
            db.add(perfil)

    db.commit()
    print("Perfis criados.")


def criar_usuarios(db: Session):
    """Criar usuarios mockados: admin e coordenador."""
    usuarios = [
        Usuario(
            ref_usuario="ADM001",
            nome="Administrador Sistema",
            email="admin@ifpb.edu.br",
            senha_hash=get_password_hash("admin123"),
            perfil=PerfilUsuario.ADMINISTRADOR,
            ativo=True
        ),
        Usuario(
            ref_usuario="COORD001",
            nome="Maria Silva",
            email="maria.silva@ifpb.edu.br",
            senha_hash=get_password_hash("coord123"),
            perfil=PerfilUsuario.COORDENADOR,
            ativo=True
        ),
        Usuario(
            ref_usuario="GESTOR001",
            nome="Joao Santos",
            email="joao.santos@ifpb.edu.br",
            senha_hash=get_password_hash("gestor123"),
            perfil=PerfilUsuario.GESTOR_POLO,
            ativo=True
        ),
    ]

    for usuario in usuarios:
        existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
        if not existente:
            db.add(usuario)

    db.commit()
    print("Usuarios criados.")


def criar_parametros(db: Session):
    """Criar parametros de regra conforme Resolucao 11/2022."""
    hoje = date.today()

    parametros = [
        # Valores de bolsa
        ParametroRegra(
            tipo_regra=TipoParametroRegra.VALOR_BOLSA,
            categoria_bolsa=CategoriaBolsa.PESQUISADOR_MASTER,
            descricao="Pesquisador Master - 20h semanais",
            valor_bolsa_referencia=Decimal("4585.00"),
            carga_horaria_referencia=20,
            vigencia_inicio=date(2022, 1, 1),
            ativo=True
        ),
        ParametroRegra(
            tipo_regra=TipoParametroRegra.VALOR_BOLSA,
            categoria_bolsa=CategoriaBolsa.PROFISSIONAL_JUNIOR,
            descricao="Profissional Junior - 160h mensais",
            valor_bolsa_referencia=Decimal("5484.80"),
            carga_horaria_referencia=40,
            vigencia_inicio=date(2022, 1, 1),
            ativo=True
        ),
        ParametroRegra(
            tipo_regra=TipoParametroRegra.VALOR_BOLSA,
            categoria_bolsa=CategoriaBolsa.ESTUDANTE_SUPERIOR_AVANCADO,
            descricao="Estudante Nivel Superior Avancado - 80h mensais",
            valor_bolsa_referencia=Decimal("1250.40"),
            carga_horaria_referencia=20,
            vigencia_inicio=date(2022, 1, 1),
            ativo=True
        ),
        # Limite de carga horaria
        ParametroRegra(
            tipo_regra=TipoParametroRegra.LIMITE_CARGA_HORARIA,
            descricao="Limite maximo de carga horaria semanal por pesquisador",
            limite_carga_horaria_semanal=40,
            vigencia_inicio=date(2022, 1, 1),
            ativo=True
        ),
    ]

    for param in parametros:
        existente = db.query(ParametroRegra).filter(
            ParametroRegra.tipo_regra == param.tipo_regra,
            ParametroRegra.categoria_bolsa == param.categoria_bolsa
        ).first()
        if not existente:
            db.add(param)

    db.commit()
    print("Parametros criados.")


def criar_projeto(db: Session):
    """Criar projeto mockado."""
    coordenador = db.query(Usuario).filter(Usuario.perfil == PerfilUsuario.COORDENADOR).first()

    if not coordenador:
        print("Coordenador nao encontrado. Execute criar_usuarios primeiro.")
        return

    projeto_existente = db.query(Projeto).filter(Projeto.codigo == "PROJ-2024-001").first()

    if projeto_existente:
        print("Projeto ja existe.")
        return

    projeto = Projeto(
        codigo="PROJ-2024-001",
        titulo="Sistema de Gestao de RH - Banco de Especialistas",
        descricao="Desenvolvimento de sistema web para gestao de equipes de projetos de PD&I",
        data_inicio=date.today(),
        data_fim=date.today() + timedelta(days=365),
        coordenador_id=coordenador.id,
        status=StatusProjeto.ATIVO
    )

    db.add(projeto)
    db.commit()
    db.refresh(projeto)

    # Criar versao inicial de RH
    versao = VersaoRHProjeto(
        projeto_id=projeto.id,
        numero_versao=1,
        status=StatusVersaoRH.VIGENTE
    )
    db.add(versao)
    db.commit()
    db.refresh(versao)

    # Adicionar pesquisadores mockados
    pesquisadores = [
        PesquisadorProjeto(
            ref_pesquisador="PES001",
            nome_pesquisador="Carlos Oliveira",
            versao_rh_id=versao.id,
            categoria_bolsa=CategoriaBolsa.PESQUISADOR_MASTER,
            fonte_financiamento=FonteFinanciamento.EMBRAPII,
            carga_horaria_semanal=20,
            valor_bolsa=Decimal("4585.00"),
            data_inicio=date.today(),
            origem_rh="Banco de Especialistas"
        ),
        PesquisadorProjeto(
            ref_pesquisador="PES002",
            nome_pesquisador="Ana Costa",
            versao_rh_id=versao.id,
            categoria_bolsa=CategoriaBolsa.PROFISSIONAL_JUNIOR,
            fonte_financiamento=FonteFinanciamento.EMPRESA,
            carga_horaria_semanal=40,
            valor_bolsa=Decimal("5484.80"),
            data_inicio=date.today(),
            origem_rh="Banco de Especialistas"
        ),
        PesquisadorProjeto(
            ref_pesquisador="PES003",
            nome_pesquisador="Pedro Souza",
            versao_rh_id=versao.id,
            categoria_bolsa=CategoriaBolsa.ESTUDANTE_SUPERIOR_AVANCADO,
            fonte_financiamento=FonteFinanciamento.SEBRAE,
            carga_horaria_semanal=20,
            valor_bolsa=Decimal("1250.40"),
            data_inicio=date.today(),
            origem_rh="Banco de Especialistas"
        ),
    ]

    for pesquisador in pesquisadores:
        db.add(pesquisador)

    db.commit()
    print("Projeto e pesquisadores criados.")


def main():
    """Executar seed de dados."""
    print("Iniciando seed de dados...")

    # Criar tabelas
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas.")

    db = SessionLocal()

    try:
        criar_perfis(db)
        criar_usuarios(db)
        criar_parametros(db)
        criar_projeto(db)
        print("\nSeed concluido com sucesso!")
        print("\nUsuarios criados:")
        print("  - admin@ifpb.edu.br / admin123 (Administrador)")
        print("  - maria.silva@ifpb.edu.br / coord123 (Coordenador)")
        print("  - joao.santos@ifpb.edu.br / gestor123 (Gestor do Polo)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
