import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthContextType {
  token: string | null
  login: (access: string, refresh: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))

  function login(access: string, refresh: string) {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    setToken(access)
  }

  function logout() {
    localStorage.clear()
    setToken(null)
  }

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
