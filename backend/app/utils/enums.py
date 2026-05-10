from enum import Enum


class PerfilUsuario(str, Enum):
    """Perfis de usuario conforme docs/01-visao-geral.md"""
    ADMINISTRADOR = "ADMINISTRADOR"
    COORDENADOR = "COORDENADOR"
    GESTOR_POLO = "GESTOR_POLO"
    APOIO_COORDENADOR = "APOIO_COORDENADOR"


class FonteFinanciamento(str, Enum):
    """Fontes de financiamento dos projetos"""
    EMBRAPII = "EMBRAPII"
    EMPRESA = "EMPRESA"
    SEBRAE = "SEBRAE"
    IFPB = "IFPB"


class TipoSolicitacao(str, Enum):
    """Tipos de solicitacao de RH"""
    IMPLANTACAO = "IMPLANTACAO"
    ALTERACAO = "ALTERACAO"
    PAGAMENTO = "PAGAMENTO"


class StatusSolicitacao(str, Enum):
    """Status da solicitacao"""
    EM_EDICAO = "EM_EDICAO"
    SUBMETIDA = "SUBMETIDA"
    APROVADA = "APROVADA"
    REJEITADA = "REJEITADA"


class StatusVersaoRH(str, Enum):
    """Status da versao de RH do projeto"""
    PROPOSTA = "PROPOSTA"
    VIGENTE = "VIGENTE"
    HISTORICO = "HISTORICO"


class StatusTransferencia(str, Enum):
    """Status da transferencia de pesquisador"""
    PENDENTE = "PENDENTE"
    ACEITA = "ACEITA"
    RECUSADA = "RECUSADA"


class StatusProjeto(str, Enum):
    """Status do projeto"""
    ATIVO = "ATIVO"
    FINALIZADO = "FINALIZADO"
    SUSPENSO = "SUSPENSO"


class CategoriaBolsa(str, Enum):
    """Categorias de bolsa conforme Resolucao 11/2022"""
    PESQUISADOR_MASTER = "PESQUISADOR_MASTER"
    PESQUISADOR_SENIOR = "PESQUISADOR_SENIOR"
    PESQUISADOR_PLENO = "PESQUISADOR_PLENO"
    PESQUISADOR_JUNIOR = "PESQUISADOR_JUNIOR"
    PROFISSIONAL_SENIOR = "PROFISSIONAL_SENIOR"
    PROFISSIONAL_PLENO = "PROFISSIONAL_PLENO"
    PROFISSIONAL_JUNIOR = "PROFISSIONAL_JUNIOR"
    PROFISSIONAL_INICIANTE = "PROFISSIONAL_INICIANTE"
    ESTUDANTE_SUPERIOR_AVANCADO = "ESTUDANTE_SUPERIOR_AVANCADO"
    ESTUDANTE_SUPERIOR_INTERMEDIARIO = "ESTUDANTE_SUPERIOR_INTERMEDIARIO"
    ESTUDANTE_SUPERIOR_INICIANTE = "ESTUDANTE_SUPERIOR_INICIANTE"
    ESTUDANTE_MEDIO = "ESTUDANTE_MEDIO"


class TipoParametroRegra(str, Enum):
    """Tipos de parametros/regras"""
    VALOR_BOLSA = "VALOR_BOLSA"
    LIMITE_CARGA_HORARIA = "LIMITE_CARGA_HORARIA"
