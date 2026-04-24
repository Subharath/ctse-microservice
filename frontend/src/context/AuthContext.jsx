import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'
import { unwrapApiData } from '../api/client'
import {
  clearSession as clearStoredSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  storeSession,
  updateAccessToken,
  updateStoredUser,
} from '../api/session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [token, setToken] = useState(() => getAccessToken())
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  const saveSession = (userData, jwt, refreshToken) => {
    setUser(userData)
    setToken(jwt)
    storeSession({
      user: userData,
      token: jwt,
      refreshToken,
    })
  }

  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    clearStoredSession()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      const data = unwrapApiData(res.data)
      const { token: jwt, refreshToken, user: userData } = data || {}

      if (!jwt || !refreshToken || !userData) {
        return { success: false, message: 'Invalid authentication response from server' }
      }

      saveSession(userData, jwt, refreshToken)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed',
      }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const res = await authApi.register(name, email, password)
      const data = unwrapApiData(res.data)
      const { token: jwt, refreshToken, user: userData } = data || {}

      if (!jwt || !refreshToken || !userData) {
        return { success: false, message: 'Invalid registration response from server' }
      }

      saveSession(userData, jwt, refreshToken)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed',
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const syncUser = useCallback((nextUser) => {
    setUser(nextUser)
    updateStoredUser(nextUser)
  }, [])

  useEffect(() => {
    let active = true

    const bootstrapSession = async () => {
      const storedRefreshToken = getRefreshToken()

      if (!storedRefreshToken) {
        if (active) {
          setReady(true)
        }
        return
      }

      try {
        const res = await authApi.refresh(storedRefreshToken)
        const data = unwrapApiData(res.data)

        if (data?.token && active) {
          setToken(data.token)
          updateAccessToken(data.token)
        }
      } catch {
        if (active) {
          clearSession()
        }
      } finally {
        if (active) {
          setReady(true)
        }
      }
    }

    bootstrapSession()

    return () => {
      active = false
    }
  }, [clearSession])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        ready,
        login,
        register,
        logout,
        syncUser,
        isAdmin,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
