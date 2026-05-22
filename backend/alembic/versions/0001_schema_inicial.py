"""Schema inicial — todas as tabelas do DER

Revision ID: 0001
Revises:
Create Date: 2026-05-22

Cria o schema completo conforme docs/03-modelo-dados.md:
  perfil, usuario, parametro_regra, projeto, projeto_anexo,
  solicitacao_rh, versao_rh_projeto, pesquisador_projeto, transferencia_rh
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

# --- Tipos ENUM (PostgreSQL cria tipos nativos) ---

enum_perfil = sa.Enum(
    "ADMINISTRADOR", "COORDENADOR", "GESTOR_POLO", "APOIO_COORDENADOR",
    name="perfilusuario",
)
enum_fonte = sa.Enum(
    "EMBRAPII", "EMPRESA", "SEBRAE", "IFPB",
    name="fontefinanciamento",
)
enum_tipo_solicitacao = sa.Enum(
    "IMPLANTACAO", "ALTERACAO", "PAGAMENTO",
    name="tiposolicitacao",
)
enum_status_solicitacao = sa.Enum(
    "EM_EDICAO", "SUBMETIDA", "APROVADA", "REJEITADA",
    name="statussolicitacao",
)
enum_status_versao = sa.Enum(
    "PROPOSTA", "VIGENTE", "HISTORICO",
    name="statusversaorh",
)
enum_status_projeto = sa.Enum(
    "ATIVO", "FINALIZADO", "SUSPENSO",
    name="statusprojeto",
)
enum_status_transferencia = sa.Enum(
    "PENDENTE", "ACEITA", "RECUSADA",
    name="statustransferencia",
)
enum_categoria_bolsa = sa.Enum(
    "PESQUISADOR_MASTER", "PESQUISADOR_SENIOR", "PESQUISADOR_PLENO", "PESQUISADOR_JUNIOR",
    "PROFISSIONAL_SENIOR", "PROFISSIONAL_PLENO", "PROFISSIONAL_JUNIOR", "PROFISSIONAL_INICIANTE",
    "ESTUDANTE_SUPERIOR_AVANCADO", "ESTUDANTE_SUPERIOR_INTERMEDIARIO",
    "ESTUDANTE_SUPERIOR_INICIANTE", "ESTUDANTE_MEDIO",
    name="categoriabolsa",
)
enum_tipo_parametro = sa.Enum(
    "VALOR_BOLSA", "LIMITE_CARGA_HORARIA",
    name="tipoparametroregra",
)


def upgrade() -> None:
    # Criar tipos ENUM primeiro
    enum_perfil.create(op.get_bind(), checkfirst=True)
    enum_fonte.create(op.get_bind(), checkfirst=True)
    enum_tipo_solicitacao.create(op.get_bind(), checkfirst=True)
    enum_status_solicitacao.create(op.get_bind(), checkfirst=True)
    enum_status_versao.create(op.get_bind(), checkfirst=True)
    enum_status_projeto.create(op.get_bind(), checkfirst=True)
    enum_status_transferencia.create(op.get_bind(), checkfirst=True)
    enum_categoria_bolsa.create(op.get_bind(), checkfirst=True)
    enum_tipo_parametro.create(op.get_bind(), checkfirst=True)

    # 1. perfil (lookup sem FK)
    op.create_table(
        "perfil",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("codigo", sa.Enum("ADMINISTRADOR", "COORDENADOR", "GESTOR_POLO", "APOIO_COORDENADOR", name="perfilusuario"), nullable=False),
        sa.Column("descricao", sa.String(255), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo"),
    )
    op.create_index("ix_perfil_id", "perfil", ["id"])

    # 2. usuario
    op.create_table(
        "usuario",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ref_usuario", sa.String(100), nullable=False),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("senha_hash", sa.String(255), nullable=False),
        sa.Column("perfil", sa.Enum("ADMINISTRADOR", "COORDENADOR", "GESTOR_POLO", "APOIO_COORDENADOR", name="perfilusuario"), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_usuario_id", "usuario", ["id"])
    op.create_index("ix_usuario_ref_usuario", "usuario", ["ref_usuario"], unique=True)
    op.create_index("ix_usuario_email", "usuario", ["email"], unique=True)

    # 3. parametro_regra (sem FK)
    op.create_table(
        "parametro_regra",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tipo_regra", sa.Enum("VALOR_BOLSA", "LIMITE_CARGA_HORARIA", name="tipoparametroregra"), nullable=False),
        sa.Column("categoria_bolsa", sa.Enum(
            "PESQUISADOR_MASTER", "PESQUISADOR_SENIOR", "PESQUISADOR_PLENO", "PESQUISADOR_JUNIOR",
            "PROFISSIONAL_SENIOR", "PROFISSIONAL_PLENO", "PROFISSIONAL_JUNIOR", "PROFISSIONAL_INICIANTE",
            "ESTUDANTE_SUPERIOR_AVANCADO", "ESTUDANTE_SUPERIOR_INTERMEDIARIO",
            "ESTUDANTE_SUPERIOR_INICIANTE", "ESTUDANTE_MEDIO",
            name="categoriabolsa",
        ), nullable=True),
        sa.Column("descricao", sa.String(255), nullable=False),
        sa.Column("valor_bolsa_referencia", sa.Numeric(10, 2), nullable=True),
        sa.Column("carga_horaria_referencia", sa.Integer(), nullable=True),
        sa.Column("limite_carga_horaria_semanal", sa.Integer(), nullable=True),
        sa.Column("vigencia_inicio", sa.Date(), nullable=False),
        sa.Column("vigencia_fim", sa.Date(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_parametro_regra_id", "parametro_regra", ["id"])
    op.create_index("ix_parametro_regra_tipo_regra", "parametro_regra", ["tipo_regra"])
    op.create_index("ix_parametro_regra_categoria_bolsa", "parametro_regra", ["categoria_bolsa"])
    op.create_index("ix_parametro_regra_vigencia_inicio", "parametro_regra", ["vigencia_inicio"])
    op.create_index("ix_parametro_regra_vigencia_fim", "parametro_regra", ["vigencia_fim"])

    # 4. projeto (FK -> usuario)
    op.create_table(
        "projeto",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("codigo", sa.String(50), nullable=False),
        sa.Column("titulo", sa.String(500), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("data_inicio", sa.Date(), nullable=False),
        sa.Column("data_fim", sa.Date(), nullable=False),
        sa.Column("coordenador_id", sa.Integer(), sa.ForeignKey("usuario.id"), nullable=False),
        sa.Column("status", sa.Enum("ATIVO", "FINALIZADO", "SUSPENSO", name="statusprojeto"), nullable=False, server_default="ATIVO"),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_projeto_id", "projeto", ["id"])
    op.create_index("ix_projeto_codigo", "projeto", ["codigo"], unique=True)

    # 5. projeto_anexo (FK -> projeto)
    op.create_table(
        "projeto_anexo",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("projeto_id", sa.Integer(), sa.ForeignKey("projeto.id"), nullable=False),
        sa.Column("tipo_documento", sa.String(100), nullable=False),
        sa.Column("numero_documento", sa.String(100), nullable=True),
        sa.Column("caminho_arquivo", sa.String(500), nullable=False),
        sa.Column("nome_arquivo_original", sa.String(255), nullable=False),
        sa.Column("data_upload", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_projeto_anexo_id", "projeto_anexo", ["id"])

    # 6. solicitacao_rh (FK -> projeto, usuario)
    op.create_table(
        "solicitacao_rh",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("identificador", sa.String(50), nullable=False),
        sa.Column("projeto_id", sa.Integer(), sa.ForeignKey("projeto.id"), nullable=False),
        sa.Column("tipo", sa.Enum("IMPLANTACAO", "ALTERACAO", "PAGAMENTO", name="tiposolicitacao"), nullable=False),
        sa.Column("status", sa.Enum("EM_EDICAO", "SUBMETIDA", "APROVADA", "REJEITADA", name="statussolicitacao"), nullable=False, server_default="EM_EDICAO"),
        sa.Column("mes_ano_referencia", sa.String(7), nullable=True),
        sa.Column("justificativa", sa.Text(), nullable=True),
        sa.Column("criado_por", sa.Integer(), sa.ForeignKey("usuario.id"), nullable=False),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_solicitacao_rh_id", "solicitacao_rh", ["id"])
    op.create_index("ix_solicitacao_rh_identificador", "solicitacao_rh", ["identificador"])

    # 7. versao_rh_projeto (FK -> projeto, solicitacao_rh)
    op.create_table(
        "versao_rh_projeto",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("projeto_id", sa.Integer(), sa.ForeignKey("projeto.id"), nullable=False),
        sa.Column("numero_versao", sa.Integer(), nullable=False),
        sa.Column("status", sa.Enum("PROPOSTA", "VIGENTE", "HISTORICO", name="statusversaorh"), nullable=False, server_default="PROPOSTA"),
        sa.Column("solicitacao_id", sa.Integer(), sa.ForeignKey("solicitacao_rh.id"), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_versao_rh_projeto_id", "versao_rh_projeto", ["id"])

    # 8. pesquisador_projeto (FK -> versao_rh_projeto)
    op.create_table(
        "pesquisador_projeto",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ref_pesquisador", sa.String(100), nullable=False),
        sa.Column("nome_pesquisador", sa.String(255), nullable=False),
        sa.Column("versao_rh_id", sa.Integer(), sa.ForeignKey("versao_rh_projeto.id"), nullable=False),
        sa.Column("categoria_bolsa", sa.Enum(
            "PESQUISADOR_MASTER", "PESQUISADOR_SENIOR", "PESQUISADOR_PLENO", "PESQUISADOR_JUNIOR",
            "PROFISSIONAL_SENIOR", "PROFISSIONAL_PLENO", "PROFISSIONAL_JUNIOR", "PROFISSIONAL_INICIANTE",
            "ESTUDANTE_SUPERIOR_AVANCADO", "ESTUDANTE_SUPERIOR_INTERMEDIARIO",
            "ESTUDANTE_SUPERIOR_INICIANTE", "ESTUDANTE_MEDIO",
            name="categoriabolsa",
        ), nullable=False),
        sa.Column("fonte_financiamento", sa.Enum("EMBRAPII", "EMPRESA", "SEBRAE", "IFPB", name="fontefinanciamento"), nullable=False),
        sa.Column("carga_horaria_semanal", sa.Integer(), nullable=False),
        sa.Column("valor_bolsa", sa.Numeric(10, 2), nullable=False),
        sa.Column("data_inicio", sa.Date(), nullable=False),
        sa.Column("data_fim", sa.Date(), nullable=True),
        sa.Column("origem_rh", sa.String(100), nullable=True),
        sa.Column("motivo_encerramento", sa.String(500), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pesquisador_projeto_id", "pesquisador_projeto", ["id"])
    op.create_index("ix_pesquisador_projeto_ref_pesquisador", "pesquisador_projeto", ["ref_pesquisador"])

    # 9. transferencia_rh (FK -> projeto x2, usuario x2, solicitacao_rh x2)
    op.create_table(
        "transferencia_rh",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ref_pesquisador", sa.String(100), nullable=False),
        sa.Column("nome_pesquisador", sa.String(255), nullable=False),
        sa.Column("projeto_origem_id", sa.Integer(), sa.ForeignKey("projeto.id"), nullable=False),
        sa.Column("projeto_destino_id", sa.Integer(), sa.ForeignKey("projeto.id"), nullable=False),
        sa.Column("coordenador_solicitante_id", sa.Integer(), sa.ForeignKey("usuario.id"), nullable=False),
        sa.Column("coordenador_cedente_id", sa.Integer(), sa.ForeignKey("usuario.id"), nullable=False),
        sa.Column("status", sa.Enum("PENDENTE", "ACEITA", "RECUSADA", name="statustransferencia"), nullable=False, server_default="PENDENTE"),
        sa.Column("justificativa_solicitacao", sa.Text(), nullable=True),
        sa.Column("justificativa_parecer", sa.Text(), nullable=True),
        sa.Column("data_parecer", sa.Date(), nullable=True),
        sa.Column("solicitacao_origem_id", sa.Integer(), sa.ForeignKey("solicitacao_rh.id"), nullable=True),
        sa.Column("solicitacao_destino_id", sa.Integer(), sa.ForeignKey("solicitacao_rh.id"), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transferencia_rh_id", "transferencia_rh", ["id"])
    op.create_index("ix_transferencia_rh_ref_pesquisador", "transferencia_rh", ["ref_pesquisador"])


def downgrade() -> None:
    # Dropar em ordem inversa de dependencia
    op.drop_table("transferencia_rh")
    op.drop_table("pesquisador_projeto")
    op.drop_table("versao_rh_projeto")
    op.drop_table("solicitacao_rh")
    op.drop_table("projeto_anexo")
    op.drop_table("projeto")
    op.drop_table("parametro_regra")
    op.drop_table("usuario")
    op.drop_table("perfil")

    # Dropar tipos ENUM
    enum_status_transferencia.drop(op.get_bind(), checkfirst=True)
    enum_categoria_bolsa.drop(op.get_bind(), checkfirst=True)
    enum_status_versao.drop(op.get_bind(), checkfirst=True)
    enum_status_projeto.drop(op.get_bind(), checkfirst=True)
    enum_status_solicitacao.drop(op.get_bind(), checkfirst=True)
    enum_tipo_solicitacao.drop(op.get_bind(), checkfirst=True)
    enum_tipo_parametro.drop(op.get_bind(), checkfirst=True)
    enum_fonte.drop(op.get_bind(), checkfirst=True)
    enum_perfil.drop(op.get_bind(), checkfirst=True)
