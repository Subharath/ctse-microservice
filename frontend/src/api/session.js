const STORAGE_KEYS = {
  user: 'user',
  token: 'token',
  refreshToken: 'refreshToken',
}

let accessToken = localStorage.getItem(STORAGE_KEYS.token) || null
let refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken) || null

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user))
  } catch {
    return null
  }
}

const getAccessToken = () => accessToken

const getRefreshToken = () => refreshToken

const storeSession = ({ user, token, refreshToken: nextRefreshToken }) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
  }

  if (token) {
    accessToken = token
    localStorage.setItem(STORAGE_KEYS.token, token)
  }

  if (nextRefreshToken) {
    refreshToken = nextRefreshToken
    localStorage.setItem(STORAGE_KEYS.refreshToken, nextRefreshToken)
  }
}

const updateAccessToken = (token) => {
  accessToken = token || null

  if (token) {
    localStorage.setItem(STORAGE_KEYS.token, token)
  } else {
    localStorage.removeItem(STORAGE_KEYS.token)
  }
}

const updateStoredUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
    return
  }

  localStorage.removeItem(STORAGE_KEYS.user)
}

const clearSession = () => {
  accessToken = null
  refreshToken = null
  localStorage.removeItem(STORAGE_KEYS.user)
  localStorage.removeItem(STORAGE_KEYS.token)
  localStorage.removeItem(STORAGE_KEYS.refreshToken)
}

export {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  storeSession,
  updateAccessToken,
  updateStoredUser,
}
