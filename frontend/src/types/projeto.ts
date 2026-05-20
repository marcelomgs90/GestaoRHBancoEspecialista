import { CategoriaBolsa } from './enums'

export interface ProjetoCreate {
  codigo: string
  titulo: string
  descricao?: string
  data_inicio: string
  data_fim: string
  status?: string
}

export interface VersaoRHProjeto {
  id: number
  projeto_id: number
  numero_versao: number
  status: string
  solicitacao_id: number | null
  criado_em: string
}

export interface Projeto {
  id: number
  codigo: string
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string
  status: string
  coordenador_id: number
  criado_em: string
  atualizado_em: string
}

export const CATEGORIA_BOLSA_LABELS: Record<CategoriaBolsa, { funcao: string; nivel: string }> = {
  [CategoriaBolsa.PESQUISADOR_MASTER]: { funcao: 'Pesquisador', nivel: 'MASTER' },
  [CategoriaBolsa.PESQUISADOR_SENIOR]: { funcao: 'Pesquisador', nivel: 'SÊNIOR' },
  [CategoriaBolsa.PESQUISADOR_PLENO]: { funcao: 'Pesquisador', nivel: 'PLENO' },
  [CategoriaBolsa.PESQUISADOR_JUNIOR]: { funcao: 'Pesquisador', nivel: 'JÚNIOR' },
  [CategoriaBolsa.PROFISSIONAL_SENIOR]: { funcao: 'Profissional', nivel: 'SÊNIOR' },
  [CategoriaBolsa.PROFISSIONAL_PLENO]: { funcao: 'Profissional', nivel: 'PLENO' },
  [CategoriaBolsa.PROFISSIONAL_JUNIOR]: { funcao: 'Profissional', nivel: 'JÚNIOR' },
  [CategoriaBolsa.PROFISSIONAL_INICIANTE]: { funcao: 'Profissional', nivel: 'INICIANTE' },
  [CategoriaBolsa.ESTUDANTE_SUPERIOR_AVANCADO]: { funcao: 'Est. Superior', nivel: 'AVANÇADO' },
  [CategoriaBolsa.ESTUDANTE_SUPERIOR_INTERMEDIARIO]: { funcao: 'Est. Superior', nivel: 'INTERM.' },
  [CategoriaBolsa.ESTUDANTE_SUPERIOR_INICIANTE]: { funcao: 'Est. Superior', nivel: 'INICIANTE' },
  [CategoriaBolsa.ESTUDANTE_MEDIO]: { funcao: 'Estudante Médio', nivel: 'MÉDIO' },
}

const AVATAR_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#f97316',
]

export function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

export function getYear(dateStr: string): string {
  return dateStr.split('T')[0].split('-')[0]
}

export function formatCurrency(value: number | string): string {
  return `R$ ${Math.round(Number(value)).toLocaleString('pt-BR')}`
}
