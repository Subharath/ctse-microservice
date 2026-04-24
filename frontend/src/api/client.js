import axios from 'axios'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
} from './session'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const unwrapApiData = (payload) => {
  const unwrap = (value) => {
    if (value === null || value === undefined) return value
    if (Array.isArray(value)) return value
    if (typeof value !== 'object') return value

    if (Object.prototype.hasOwnProperty.call(value, 'success') && Object.prototype.hasOwnProperty.call(value, 'data')) {
      const nested = unwrap(value.data)

      if (Object.prototype.hasOwnProperty.call(value, 'pagination')) {
        return {
          products: Array.isArray(nested) ? nested : (nested?.products || []),
          pagination: value.pagination,
        }
      }

      return nested
    }

    return value
  }

  return unwrap(payload)
}

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

let refreshPromise = null

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    const storedRefreshToken = getRefreshToken()

    if (!storedRefreshToken) {
      throw new Error('No refresh token available')
    }

    refreshPromise = axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: storedRefreshToken }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })
      .then((response) => {
        const refreshed = unwrapApiData(response.data)
        if (!refreshed?.token) {
          throw new Error('Refresh response missing access token')
        }

        updateAccessToken(refreshed.token)
        return refreshed.token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {}
    const requestUrl = String(originalRequest.url || '')

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register') &&
      !requestUrl.includes('/auth/refresh')
    ) {
      try {
        originalRequest._retry = true
        const nextToken = await refreshAccessToken()
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${nextToken}`,
        }

        return client(originalRequest)
      } catch {
        clearSession()
        redirectToLogin()
      }
    } else if (error.response?.status === 401) {
      clearSession()
      redirectToLogin()
    }

    return Promise.reject(error)
  }
)

export default client
