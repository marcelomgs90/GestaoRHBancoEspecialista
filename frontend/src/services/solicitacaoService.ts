import { api } from './api'
import { Solicitacao, SolicitacaoCreate, Membro, MembroCreate, ComparacaoResponse } from '../types/solicitacao'

export const solicitacaoService = {
  async listar(projetoId?: number): Promise<Solicitacao[]> {
    const params = projetoId ? { projeto_id: projetoId } : {}
    const response = await api.get<Solicitacao[]>('/solicitacoes/', { params })
    return response.data
  },

  async obter(id: number): Promise<Solicitacao> {
    const response = await api.get<Solicitacao>(`/solicitacoes/${id}`)
    return response.data
  },

  async criar(dados: SolicitacaoCreate): Promise<Solicitacao> {
    const response = await api.post<Solicitacao>('/solicitacoes/', dados)
    return response.data
  },

  async atualizarJustificativa(solicitacaoId: number, justificativa: string): Promise<Solicitacao> {
    const response = await api.patch<Solicitacao>(
      `/solicitacoes/${solicitacaoId}/justificativa`,
      { justificativa },
    )
    return response.data
  },

  async listarMembros(solicitacaoId: number): Promise<Membro[]> {
    const response = await api.get<Membro[]>(`/solicitacoes/${solicitacaoId}/membros`)
    return response.data
  },

  async incluirMembro(solicitacaoId: number, dados: MembroCreate): Promise<Membro> {
    const response = await api.post<Membro>(`/solicitacoes/${solicitacaoId}/membros`, dados)
    return response.data
  },

  async atualizarMembro(solicitacaoId: number, membroId: number, dados: Partial<MembroCreate>): Promise<Membro> {
    const response = await api.put<Membro>(`/solicitacoes/${solicitacaoId}/membros/${membroId}`, dados)
    return response.data
  },

  async encerrarMembro(solicitacaoId: number, membroId: number, motivo?: string): Promise<void> {
    await api.delete(`/solicitacoes/${solicitacaoId}/membros/${membroId}`, {
      params: { motivo },
    })
  },

  async comparar(solicitacaoId: number): Promise<ComparacaoResponse> {
    const response = await api.get<ComparacaoResponse>(`/solicitacoes/${solicitacaoId}/comparacao`)
    return response.data
  },

  async submeter(solicitacaoId: number): Promise<Solicitacao> {
    const response = await api.post<Solicitacao>(`/solicitacoes/${solicitacaoId}/submeter`)
    return response.data
  },

  async aprobar(solicitacaoId: number): Promise<Solicitacao> {
    const response = await api.post<Solicitacao>(`/solicitacoes/${solicitacaoId}/aprovar`)
    return response.data
  },

  async rejeitar(solicitacaoId: number, justificativa?: string): Promise<Solicitacao> {
    const body = justificativa ? { justificativa } : {}
    const response = await api.post<Solicitacao>(`/solicitacoes/${solicitacaoId}/rejeitar`, body)
    return response.data
  },
}
