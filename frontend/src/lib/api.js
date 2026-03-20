import axios from 'axios'

export const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const ACCESS_TOKEN_KEY = 'echo_access_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export function setAccessToken(token) {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    return
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

async function refreshAccessToken() {
  const response = await axios.post(
    `${API_BASE}/api/auth/refresh`,
    {},
    { withCredentials: true },
  )

  const nextToken = response.data?.accessToken

  if (nextToken) {
    setAccessToken(nextToken)
  }

  return nextToken
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    const status = error.response?.status

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (originalRequest.url?.includes('/api/auth/login') || originalRequest.url?.includes('/api/auth/register')) {
      return Promise.reject(error)
    }

    if (originalRequest.url?.includes('/api/auth/refresh')) {
      clearAccessToken()
      return Promise.reject(error)
    }

    try {
      originalRequest._retry = true
      const nextToken = await refreshAccessToken()

      if (!nextToken) {
        clearAccessToken()
        return Promise.reject(error)
      }

      originalRequest.headers.Authorization = `Bearer ${nextToken}`
      return api(originalRequest)
    } catch (refreshErr) {
      clearAccessToken()
      return Promise.reject(refreshErr)
    }
  },
)

export default api