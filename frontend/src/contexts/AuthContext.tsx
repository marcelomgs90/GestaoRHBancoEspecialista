import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Usuario, LoginCredentials, AuthState } from '../types/auth'
import { authService } from '../services/authService'

const AuthContext = createContext<AuthState | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!token && !!user

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const storedToken = localStorage.getItem('token')

    if (!storedToken) {
      setIsLoading(false)
      return
    }

    setToken(storedToken)

    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function login(credentials: LoginCredentials) {
    const response = await authService.login(credentials)
    const newToken = response.access_token

    localStorage.setItem('token', newToken)
    setToken(newToken)

    const userData = await authService.getCurrentUser()
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
