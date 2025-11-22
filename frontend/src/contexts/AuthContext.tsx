import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

interface AuthContextType {
  isAuthenticated: boolean
  user: any | null
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Vérifier si le token est valide
      authService.verifyToken()
        .then(() => {
          setIsAuthenticated(true)
          // Charger les infos utilisateur
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password)
    localStorage.setItem('token', response.token)
    setUser(response.user)
    setIsAuthenticated(true)
  }

  const register = async (data: any) => {
    const response = await authService.register(data)
    localStorage.setItem('token', response.token)
    setUser(response.user)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

