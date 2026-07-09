import { api } from './api'
import type { Anexo, AnexoListParams } from '../types/anexo'
import type { Paginated } from '../types/projeto'

export const anexoService = {
  async listar(
    projetoId: number,
    params: AnexoListParams = {},
  ): Promise<Paginated<Anexo>> {
    const response = await api.get<Paginated<Anexo>>(
      `/projetos/${projetoId}/anexos-amplos`,
      { params },
    )
    return response.data
  },

  async upload(projetoId: number, arquivo: File): Promise<Anexo> {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    const response = await api.post<Anexo>(
      `/projetos/${projetoId}/anexos-amplos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return response.data
  },

  async download(projetoId: number, anexoId: string): Promise<Blob> {
    const response = await api.get(
      `/projetos/${projetoId}/anexos-amplos/${anexoId}/download`,
      { responseType: 'blob' },
    )
    return response.data
  },

  async preview(projetoId: number, anexoId: string): Promise<Blob> {
    const response = await api.get(
      `/projetos/${projetoId}/anexos-amplos/${anexoId}/preview`,
      { responseType: 'blob' },
    )
    return response.data
  },

  async remover(projetoId: number, anexoId: string): Promise<void> {
    await api.delete(`/projetos/${projetoId}/anexos-amplos/${anexoId}`)
  },
}
