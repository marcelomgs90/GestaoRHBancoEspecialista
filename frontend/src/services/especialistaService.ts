import { api } from './api'

export interface Especialista {
  id: number
  nome: string
  matricula: string
}

export const especialistaService = {
  async buscar(termo?: string): Promise<Especialista[]> {
    const params = termo ? { q: termo } : {}
    const response = await api.get<Especialista[]>('/especialistas/', { params })
    return response.data
  },
}
