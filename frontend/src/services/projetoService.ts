import { api } from './api'
import { TipoDocumentoProjeto } from '../types/enums'
import { Projeto, ProjetoAnexo, ProjetoCreate, ProjetoUpdate, VersaoRHProjeto } from '../types/projeto'
import { Membro } from '../types/solicitacao'

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
  is_rascunho?: boolean
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

  async atualizar(id: number, dados: ProjetoUpdate): Promise<Projeto> {
    const response = await api.put<Projeto>(`/projetos/${id}`, dados)
    return response.data
  },

  async listarAnexos(id: number): Promise<ProjetoAnexo[]> {
    const response = await api.get<ProjetoAnexo[]>(`/projetos/${id}/anexos`)
    return response.data
  },

  async enviarAnexo(
    id: number,
    tipoDocumento: TipoDocumentoProjeto,
    arquivo: File,
    numeroDocumento?: string,
  ): Promise<ProjetoAnexo> {
    const formData = new FormData()
    formData.append('tipo_documento', tipoDocumento)
    formData.append('arquivo', arquivo)
    if (numeroDocumento?.trim()) {
      formData.append('numero_documento', numeroDocumento.trim())
    }
    const response = await api.post<ProjetoAnexo>(`/projetos/${id}/anexos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async removerAnexo(id: number, anexoId: number): Promise<void> {
    await api.delete(`/projetos/${id}/anexos/${anexoId}`)
  },

  async baixarAnexo(id: number, anexoId: number): Promise<Blob> {
    const response = await api.get(`/projetos/${id}/anexos/${anexoId}/download`, {
      responseType: 'blob',
    })
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

  /**
   * Lista apenas os pesquisadores da versão VIGENTE, ignorando PROPOSTA em rascunho.
   * Usado quando a tela precisa do "antes" real (ex.: AlteracaoPage).
   */
  async listarPesquisadoresVigentes(
    id: number,
    params: { page?: number; per_page?: number } = {},
  ): Promise<Paginated<Membro>> {
    const { page = 1, per_page = 20 } = params
    const response = await api.get<Paginated<Membro>>(
      `/projetos/${id}/pesquisadores/vigentes`,
      { params: { page, per_page } },
    )
    return response.data
  },
}
