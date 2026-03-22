import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(false)

  const saveSession = (userData, jwt) => {
    setUser(userData)
    setToken(jwt)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', jwt)
  }

  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      const { token: jwt, user: userData } = res.data.data
      saveSession(userData, jwt)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const res = await authApi.register(name, email, password)
      const { token: jwt, user: userData } = res.data.data
      saveSession(userData, jwt)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
