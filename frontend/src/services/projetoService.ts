import { api } from './api'
import { Projeto, ProjetoCreate, VersaoRHProjeto } from '../types/projeto'

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
}
