export enum PerfilUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  COORDENADOR = 'COORDENADOR',
  GESTOR_POLO = 'GESTOR_POLO',
  APOIO_COORDENADOR = 'APOIO_COORDENADOR',
}

export interface Usuario {
  id: number
  ref_usuario: string
  nome: string
  email: string
  perfil: PerfilUsuario
  ativo: boolean
}

export interface LoginCredentials {
  email: string
  senha: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface AuthState {
  user: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}
