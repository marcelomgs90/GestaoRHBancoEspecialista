import { api } from './api'
import type { Pesquisador, Paginated } from '../types/projeto'

export interface Especialista {
  id: number
  nome: string
  matricula: string
}

export interface ListarPesquisadoresParams {
  tipo?: string
  q?: string
  page?: number
  per_page?: number
}

export const especialistaService = {
  async buscar(termo?: string): Promise<Especialista[]> {
    const params = termo ? { q: termo } : {}
    const response = await api.get<Especialista[]>('/especialistas/', { params })
    return response.data
  },

  async listarPesquisadores(
    params: ListarPesquisadoresParams = {},
  ): Promise<Paginated<Pesquisador>> {
    const { page = 1, per_page = 20, tipo, q } = params
    const response = await api.get<Paginated<Pesquisador>>(
      '/especialistas/pesquisadores/',
      { params: { tipo, q, page, per_page } },
    )
    return response.data
  },
}
