import { TipoSolicitacao, StatusSolicitacao, FonteFinanciamento, CategoriaBolsa } from './enums'

export interface Solicitacao {
  id: number
  identificador: string
  projeto_id: number
  tipo: TipoSolicitacao
  status: StatusSolicitacao
  justificativa?: string
  mes_ano_referencia?: string
  criado_por: number
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
  valor_bolsa: number
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
