import { api } from './api'
import { Projeto, VersaoRHProjeto } from '../types/projeto'

export const projetoService = {
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
