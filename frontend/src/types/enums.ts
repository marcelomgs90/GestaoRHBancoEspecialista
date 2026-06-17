export enum FonteFinanciamento {
  EMBRAPII = 'EMBRAPII',
  EMPRESA = 'EMPRESA',
  SEBRAE = 'SEBRAE',
}

export enum TipoSolicitacao {
  IMPLANTACAO = 'IMPLANTACAO',
  ALTERACAO = 'ALTERACAO',
  PAGAMENTO = 'PAGAMENTO',
}

export enum TipoJustificativaSolicitacao {
  IMPLANTACAO = 'IMPLANTACAO',
  ALTERACAO = 'ALTERACAO',
  REJEICAO = 'REJEICAO',
}

export enum StatusSolicitacao {
  EM_EDICAO = 'EM_EDICAO',
  SUBMETIDA = 'SUBMETIDA',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA',
}

export enum StatusVersaoRH {
  PROPOSTA = 'PROPOSTA',
  VIGENTE = 'VIGENTE',
  HISTORICO = 'HISTORICO',
}

export enum StatusProjeto {
  ATIVO = 'ATIVO',
  FINALIZADO = 'FINALIZADO',
  SUSPENSO = 'SUSPENSO',
}

export enum CategoriaBolsa {
  PESQUISADOR_MASTER = 'PESQUISADOR_MASTER',
  PESQUISADOR_SENIOR = 'PESQUISADOR_SENIOR',
  PESQUISADOR_PLENO = 'PESQUISADOR_PLENO',
  PESQUISADOR_JUNIOR = 'PESQUISADOR_JUNIOR',
  PROFISSIONAL_SENIOR = 'PROFISSIONAL_SENIOR',
  PROFISSIONAL_PLENO = 'PROFISSIONAL_PLENO',
  PROFISSIONAL_JUNIOR = 'PROFISSIONAL_JUNIOR',
  PROFISSIONAL_INICIANTE = 'PROFISSIONAL_INICIANTE',
  ESTUDANTE_SUPERIOR_AVANCADO = 'ESTUDANTE_SUPERIOR_AVANCADO',
  ESTUDANTE_SUPERIOR_INTERMEDIARIO = 'ESTUDANTE_SUPERIOR_INTERMEDIARIO',
  ESTUDANTE_SUPERIOR_INICIANTE = 'ESTUDANTE_SUPERIOR_INICIANTE',
  ESTUDANTE_MEDIO = 'ESTUDANTE_MEDIO',
}

export const FONTE_LABELS: Record<FonteFinanciamento, string> = {
  [FonteFinanciamento.EMBRAPII]: 'EMBRAPII',
  [FonteFinanciamento.EMPRESA]: 'Empresa',
  [FonteFinanciamento.SEBRAE]: 'SEBRAE',
}

export const STATUS_SOLICITACAO_LABELS: Record<StatusSolicitacao, string> = {
  [StatusSolicitacao.EM_EDICAO]: 'Em Edição',
  [StatusSolicitacao.SUBMETIDA]: 'Submetida',
  [StatusSolicitacao.APROVADA]: 'Aprovada',
  [StatusSolicitacao.REJEITADA]: 'Rejeitada',
}

export const STATUS_PROJETO_LABELS: Record<StatusProjeto, string> = {
  [StatusProjeto.ATIVO]: 'Ativo',
  [StatusProjeto.FINALIZADO]: 'Finalizado',
  [StatusProjeto.SUSPENSO]: 'Suspenso',
}

export const TIPO_SOLICITACAO_LABELS: Record<TipoSolicitacao, string> = {
  [TipoSolicitacao.IMPLANTACAO]: 'Implantação',
  [TipoSolicitacao.ALTERACAO]: 'Alteração',
  [TipoSolicitacao.PAGAMENTO]: 'Pagamento',
}
