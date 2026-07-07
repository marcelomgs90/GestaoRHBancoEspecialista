import { api } from './api'
import { ConvitePrimeiroAcesso, LoginCredentials, TokenResponse, Usuario } from '../types/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const formData = new URLSearchParams()
    formData.append('username', credentials.email)
    formData.append('password', credentials.senha)

    const response = await api.post<TokenResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async getCurrentUser(): Promise<Usuario> {
    const response = await api.get<Usuario>('/auth/usuario-logado')
    return response.data
  },

  async validarConvite(token: string): Promise<ConvitePrimeiroAcesso> {
    const response = await api.get<ConvitePrimeiroAcesso>(`/auth/convites/${token}`)
    return response.data
  },

  async definirSenhaConvite(
    token: string,
    dados: { senha: string; confirmar_senha: string },
  ): Promise<void> {
    await api.post(`/auth/convites/${token}/definir-senha`, dados)
  },
}
