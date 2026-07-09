export type AnexoOrigem = 'USUARIO' | 'SISTEMA'

export interface Anexo {
  id: string
  id_projeto: number
  file_type: string
  nome_arquivo: string
  tamanho_bytes: number
  created_at: string
  created_by: number | null
  origem: AnexoOrigem
}

export interface AnexoListParams {
  origem?: AnexoOrigem
  page?: number
  per_page?: number
}
