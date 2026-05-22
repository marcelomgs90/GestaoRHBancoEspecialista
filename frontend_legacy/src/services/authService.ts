import { api } from './api'
import { LoginCredentials, TokenResponse, Usuario } from '../types/auth'

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
}
