import { api } from './api'
import { Projeto, ProjetoCreate, VersaoRHProjeto } from '../types/projeto'
import { Membro } from '../types/solicitacao'

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export const projetoService = {
  async criar(dados: ProjetoCreate): Promise<Projeto> {
    const response = await api.post<Projeto>('/projetos/', dados)
    return response.data
  },

  async listar(): Promise<Projeto[]> {
    const response = await api.get<Projeto[]>('/projetos/')
    return response.data
  },

  async obter(id: number): Promise<Projeto> {
    const response = await api.get<Projeto>(`/projetos/${id}`)
    return response.data
  },

  async listarVersoes(id: number): Promise<VersaoRHProjeto[]> {
    const response = await api.get<VersaoRHProjeto[]>(`/projetos/${id}/versoes`)
    return response.data
  },

  async listarPesquisadores(
    id: number,
    params: { page?: number; per_page?: number } = {},
  ): Promise<Paginated<Membro>> {
    const { page = 1, per_page = 20 } = params
    const response = await api.get<Paginated<Membro>>(`/projetos/${id}/pesquisadores`, {
      params: { page, per_page },
    })
    return response.data
  },
}
