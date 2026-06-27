import {
  TipoSolicitacao,
  StatusSolicitacao,
  FonteFinanciamento,
  CategoriaBolsa,
  TipoJustificativaSolicitacao,
} from './enums'

export interface SolicitacaoJustificativa {
  id: number
  tipo: TipoJustificativaSolicitacao
  descricao: string
  criado_por: number
  criado_em: string
}

export interface Solicitacao {
  id: number
  identificador: string
  projeto_id: number
  tipo: TipoSolicitacao
  status: StatusSolicitacao
  justificativa_implantacao?: string | null
  justificativa_alteracao?: string | null
  justificativa_rejeicao?: string | null
  justificativas?: SolicitacaoJustificativa[]
  mes_ano_referencia?: string | null
  criado_por: number
  criado_em: string
}

export interface SolicitacaoCreate {
  identificador: string
  projeto_id: number
  tipo: TipoSolicitacao
  justificativa?: string
  mes_ano_referencia?: string
}

export interface Membro {
  id: number
  ref_pesquisador: string
  nome_pesquisador: string
  categoria_bolsa: CategoriaBolsa
  fonte_financiamento: FonteFinanciamento
  carga_horaria_semanal: number
  /**
   * Sinônimo de `valor_bolsa_mensal`, mantido por compatibilidade.
   * Representa o valor integral mensal (proporcional à CH semanal).
   */
  valor_bolsa: number
  /** Valor integral mensal (proporcional à CH semanal). */
  valor_bolsa_mensal: number
  /** Valor proporcional ao período (data_inicio → data_fim). Igual ao mensal quando `data_fim` é vazio. */
  valor_bolsa_periodo: number
  /** Valor/hora médio: `valor_bolsa_mensal / carga_horaria_semanal`. */
  valor_hora_medio: number
  data_inicio: string
  data_fim?: string
  origem_rh?: string
}

export interface MembroCreate {
  ref_pesquisador: string
  nome_pesquisador: string
  categoria_bolsa: CategoriaBolsa
  fonte_financiamento: FonteFinanciamento
  carga_horaria_semanal: number
  data_inicio: string
  data_fim?: string
  origem_rh?: string
}

export interface MembroComparacao {
  id: number
  ref_pesquisador: string
  nome_pesquisador: string
  categoria_bolsa: CategoriaBolsa
  carga_horaria_semanal: number
  valor_bolsa: number
}

export interface ComparacaoResponse {
  antes: Record<string, MembroComparacao[]>
  depois: Record<string, MembroComparacao[]>
  diferencas: {
    inclusoes: Array<{ pesquisador: string; categoria: string; fonte: string }>
    alteracoes: Array<{ pesquisador: string; campo: string; de: unknown; para: unknown }>
    encerramentos: Array<{ pesquisador: string; motivo: string }>
  }
}

/** Detalhe de uma alocação vigente concorrente em outro projeto (para CH global e resumo). */
export interface AlocacaoConcorrente {
  projeto_id: number | null
  projeto_codigo: string
  projeto_titulo: string
  carga_horaria_semanal: number
  valor_hora_medio: number
  valor_bolsa_mensal: number
  fonte_financiamento: FonteFinanciamento
  data_inicio: string
  data_fim: string | null
}

/** Visão consolidada por pesquisador: alocações vigentes + agregados. */
export interface ResumoPesquisador {
  ref_pesquisador: string
  alocacoes: AlocacaoConcorrente[]
  total_projetos: number
  total_fontes: number
  ch_total: number
  valor_hora_medio_ponderado: number
  custo_total_mensal: number
}
