import { api } from './api'
import type { Paginated } from '../types/projeto'
import type { Usuario } from '../types/auth'

export const usuarioService = {
  async listarCoordenadores(
    params: { q?: string; page?: number; per_page?: number } = {},
  ): Promise<Paginated<Usuario>> {
    const { q, page = 1, per_page = 20 } = params
    const response = await api.get<Paginated<Usuario>>('/usuarios/coordenadores', {
      params: { q, page, per_page },
    })
    return response.data
  },
}
