/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import api, { clearAccessToken, getAccessToken, setAccessToken } from '../lib/api'

const AuthContext = createContext(null)

async function fetchCurrentUser() {
  const response = await api.get('/api/auth/me')
  return response.data?.user || null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        if (getAccessToken()) {
          const currentUser = await fetchCurrentUser()
          if (mounted) {
            setUser(currentUser)
          }
          return
        }

        const refresh = await api.post('/api/auth/refresh', {})
        const nextToken = refresh.data?.accessToken

        if (!nextToken) {
          throw new Error('No refresh token')
        }

        setAccessToken(nextToken)
        const currentUser = await fetchCurrentUser()

        if (mounted) {
          setUser(currentUser)
        }
      } catch {
        clearAccessToken()
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  const login = async ({ email, password }) => {
    const response = await api.post('/api/auth/login', { email, password })
    const nextToken = response.data?.accessToken

    if (nextToken) {
      setAccessToken(nextToken)
    }

    const nextUser = response.data?.user || null
    setUser(nextUser)

    return nextUser
  }

  const register = async ({ name, email, password }) => {
    const response = await api.post('/api/auth/register', { name, email, password })
    const nextToken = response.data?.accessToken

    if (nextToken) {
      setAccessToken(nextToken)
    }

    const nextUser = response.data?.user || null
    setUser(nextUser)

    return nextUser
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {})
    } finally {
      clearAccessToken()
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
