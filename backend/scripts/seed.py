"""
Script de seed para Sprint 1 — popula dados minimos para desenvolvimento e testes.

Execucao:
    cd backend
    python scripts/seed.py

Pressupostos:
  - Banco ja existe e as migracoes foram aplicadas (alembic upgrade head)
  - DATABASE_URL disponivel via variavel de ambiente ou .env
"""

import sys
import os
from datetime import date

# Adiciona raiz do backend ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.core.database import SessionLocal
from app.core.security import get_password_hash as hash_password
from app.models import Base, Usuario, Perfil, Projeto, ParametroRegra
from app.utils.enums import (
    PerfilUsuario,
    StatusProjeto,
    TipoParametroRegra,
    CategoriaBolsa,
)
from app.core.database import engine

# Garante que todas as tabelas existam (util em dev sem alembic)
Base.metadata.create_all(bind=engine)


def run_seed():
    db = SessionLocal()
    try:
        # ----- Perfis (lookup) -----
        perfis_existentes = db.query(Perfil).count()
        if perfis_existentes == 0:
            for perfil_enum, descricao in [
                (PerfilUsuario.ADMINISTRADOR, "Administrador do sistema"),
                (PerfilUsuario.COORDENADOR, "Coordenador de projeto"),
                (PerfilUsuario.GESTOR_POLO, "Gestor do Polo de Inovacao"),
                (PerfilUsuario.APOIO_COORDENADOR, "Apoio ao coordenador"),
            ]:
                db.add(Perfil(codigo=perfil_enum, descricao=descricao))
            db.flush()
            print("  [OK] Perfis criados")
        else:
            print("  [--] Perfis ja existem, pulando")

        # ----- Usuarios -----
        usuarios_existentes = db.query(Usuario).count()
        if usuarios_existentes == 0:
            usuarios_seed = [
                {
                    "ref_usuario": "ADMIN-001",
                    "nome": "Administrador do Sistema",
                    "email": "admin@ifpb.edu.br",
                    "senha": "admin123",
                    "perfil": PerfilUsuario.ADMINISTRADOR,
                },
                {
                    "ref_usuario": "COORD-001",
                    "nome": "Ana Coordenadora",
                    "email": "ana.coord@ifpb.edu.br",
                    "senha": "coord123",
                    "perfil": PerfilUsuario.COORDENADOR,
                },
                {
                    "ref_usuario": "GESTOR-001",
                    "nome": "Carlos Gestor",
                    "email": "carlos.gestor@ifpb.edu.br",
                    "senha": "gestor123",
                    "perfil": PerfilUsuario.GESTOR_POLO,
                },
                {
                    "ref_usuario": "APOIO-001",
                    "nome": "Beatriz Apoio",
                    "email": "beatriz.apoio@ifpb.edu.br",
                    "senha": "apoio123",
                    "perfil": PerfilUsuario.APOIO_COORDENADOR,
                },
            ]
            for u in usuarios_seed:
                db.add(Usuario(
                    ref_usuario=u["ref_usuario"],
                    nome=u["nome"],
                    email=u["email"],
                    senha_hash=hash_password(u["senha"]),
                    perfil=u["perfil"],
                    ativo=True,
                ))
            db.flush()
            print("  [OK] Usuarios criados (admin/coord/gestor/apoio)")
        else:
            print("  [--] Usuarios ja existem, pulando")

        # ----- Projetos -----
        projetos_existentes = db.query(Projeto).count()
        if projetos_existentes == 0:
            coordenador = db.query(Usuario).filter(
                Usuario.perfil == PerfilUsuario.COORDENADOR
            ).first()
            if coordenador:
                db.add(Projeto(
                    codigo="PROJ-2026-001",
                    titulo="Desenvolvimento de Novas Tecnologias de Armazenamento de Energia",
                    descricao=(
                        "Projeto de P&D focado em pesquisa aplicada a novas tecnologias "
                        "de baterias de alto desempenho para aplicacoes industriais."
                    ),
                    data_inicio=date(2025, 1, 1),
                    data_fim=date(2026, 12, 31),
                    coordenador_id=coordenador.id,
                    status=StatusProjeto.ATIVO,
                ))
                db.flush()
                print("  [OK] Projeto seed criado")
            else:
                print("  [!] Nenhum coordenador encontrado; projeto nao criado")
        else:
            print("  [--] Projetos ja existem, pulando")

        # ----- Parametros de Regra -----
        params_existentes = db.query(ParametroRegra).count()
        if params_existentes == 0:
            vigencia_inicio = date(2024, 1, 1)

            # Limite global de carga horaria semanal (80h/mes ~ 20h/sem)
            db.add(ParametroRegra(
                tipo_regra=TipoParametroRegra.LIMITE_CARGA_HORARIA,
                descricao="Limite semanal global de carga horaria por pesquisador (Res. 11/2022)",
                limite_carga_horaria_semanal=20,
                vigencia_inicio=vigencia_inicio,
                ativo=True,
            ))

            # Valores de bolsa (valor_referencia @ ch_referencia por semana)
            # Baseados na Resolucao 11/2022 — valores ilustrativos para seed
            valores_bolsa = [
                (CategoriaBolsa.PESQUISADOR_MASTER,               "Pesquisador Master",                6000.00, 20),
                (CategoriaBolsa.PESQUISADOR_SENIOR,               "Pesquisador Senior",                5000.00, 20),
                (CategoriaBolsa.PESQUISADOR_PLENO,                "Pesquisador Pleno",                 4000.00, 20),
                (CategoriaBolsa.PESQUISADOR_JUNIOR,               "Pesquisador Junior",                2000.00, 20),
                (CategoriaBolsa.PROFISSIONAL_SENIOR,              "Profissional Senior",               4500.00, 20),
                (CategoriaBolsa.PROFISSIONAL_PLENO,               "Profissional Pleno",                3500.00, 20),
                (CategoriaBolsa.PROFISSIONAL_JUNIOR,              "Profissional Junior",               2500.00, 40),
                (CategoriaBolsa.PROFISSIONAL_INICIANTE,           "Profissional Iniciante",            1500.00, 40),
                (CategoriaBolsa.ESTUDANTE_SUPERIOR_AVANCADO,      "Estudante Superior Avancado",       1500.00, 20),
                (CategoriaBolsa.ESTUDANTE_SUPERIOR_INTERMEDIARIO, "Estudante Superior Intermediario",  1200.00, 20),
                (CategoriaBolsa.ESTUDANTE_SUPERIOR_INICIANTE,     "Estudante Superior Iniciante",       800.00, 20),
                (CategoriaBolsa.ESTUDANTE_MEDIO,                  "Estudante de Nivel Medio",           600.00, 20),
            ]
            for categoria, descricao, valor, ch_ref in valores_bolsa:
                db.add(ParametroRegra(
                    tipo_regra=TipoParametroRegra.VALOR_BOLSA,
                    categoria_bolsa=categoria,
                    descricao=descricao,
                    valor_bolsa_referencia=valor,
                    carga_horaria_referencia=ch_ref,
                    vigencia_inicio=vigencia_inicio,
                    ativo=True,
                ))

            db.flush()
            print(f"  [OK] {len(valores_bolsa) + 1} parametros de regra criados")
        else:
            print("  [--] Parametros ja existem, pulando")

        db.commit()
        print("\nSeed concluido com sucesso!")
        print("\nCredenciais de acesso:")
        print("  Admin:   admin@ifpb.edu.br       / admin123")
        print("  Coord:   ana.coord@ifpb.edu.br   / coord123")
        print("  Gestor:  carlos.gestor@ifpb.edu.br / gestor123")
        print("  Apoio:   beatriz.apoio@ifpb.edu.br / apoio123")

    except Exception as e:
        db.rollback()
        print(f"\n[ERRO] Seed falhou: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Executando seed...")
    run_seed()
