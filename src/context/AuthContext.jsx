import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react'
import * as authApi from '../services/authApi'
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage'
import { isJwtExpired, getJwtRemainingTimeMs } from '../utils/jwt'

const AuthContext = createContext(null)

export function AuthProvider ({ children }) {
  const [user, setUser] = useState(null)
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const safeSetState = useCallback((setter, val) => {
    if (isMountedRef.current && typeof window !== 'undefined') {
      setter(val)
    }
  }, [])

  const reloadUser = useCallback(async () => {
    let token = safeGetItem('accessToken')
    if (!token || isJwtExpired(token)) {
      if (token) {
        safeRemoveItem('accessToken')
      }
      try {
        const refreshRes = await authApi.refreshToken()
        if (refreshRes?.accessToken) {
          safeSetItem('accessToken', refreshRes.accessToken)
          token = refreshRes.accessToken
        } else {
          safeSetState(setUser, null)
          safeSetState(setRoles, [])
          safeSetState(setIsLoading, false)
          return null
        }
      } catch {
        safeSetState(setUser, null)
        safeSetState(setRoles, [])
        safeSetState(setIsLoading, false)
        return null
      }
    }

    try {
      safeSetState(setIsLoading, true)
      const res = await authApi.me()
      if (res && safeGetItem('accessToken')) {
        safeSetState(setUser, res)
        safeSetState(setRoles, res.roles || [])
        return res
      }
    } catch (err) {
      safeSetState(setUser, null)
      safeSetState(setRoles, [])
    } finally {
      safeSetState(setIsLoading, false)
    }
    return null
  }, [safeSetState])

  useEffect(() => {
    reloadUser()

    if (typeof window === 'undefined') return
    const handleSessionExpired = () => {
      safeRemoveItem('accessToken')
      setUser(null)
      setRoles([])
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired)
    }
  }, [reloadUser])

  // Proaktif Sessiz Token Yenileme (Silent Token Refresh)
  useEffect(() => {
    let refreshTimer = null

    const scheduleTokenRefresh = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
      }

      const token = safeGetItem('accessToken')
      if (!token || !user) return

      const remainingMs = getJwtRemainingTimeMs(token)
      if (remainingMs <= 0) return

      // Token süresi bitmeden 2 dakika (120 sn) önce yenile (maksimum 32-bit integer sınırıyla)
      const refreshBufferMs = 2 * 60 * 1000
      const delay = Math.min(2147483647, Math.max(10000, remainingMs - refreshBufferMs))

      refreshTimer = setTimeout(async () => {
        try {
          const refreshRes = await authApi.refreshToken()
          if (refreshRes?.accessToken) {
            safeSetItem('accessToken', refreshRes.accessToken)
            scheduleTokenRefresh()
          }
        } catch {
          // Ignore background refresh failure
        }
      }, delay)
    }

    scheduleTokenRefresh()

    // Kullanıcı sekmeye geri döndüğünde süresi azalan token'ı derhal yenile
    if (typeof window === 'undefined') return

    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        const currentToken = safeGetItem('accessToken')
        if (currentToken && user) {
          const remMs = getJwtRemainingTimeMs(currentToken)
          if (remMs > 0 && remMs < 2 * 60 * 1000) {
            try {
              const res = await authApi.refreshToken()
              if (res?.accessToken) {
                safeSetItem('accessToken', res.accessToken)
              }
            } catch {}
          }
          scheduleTokenRefresh()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
    }
  }, [user])

  const login = useCallback(
    async credentials => {
      try {
        const res = await authApi.login(credentials)
        const userProfile = await reloadUser()
        if (userProfile) {
          return { ...res, user: userProfile }
        }
        throw new Error('Giriş bilgileri alınamadı.')
      } catch (err) {
        setUser(null)
        setRoles([])
        throw err
      }
    },
    [reloadUser]
  )

  const register = useCallback(async payload => {
    return authApi.register(payload)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (err) {
      // Ignore logout errors
    } finally {
      safeRemoveItem('accessToken')
      setUser(null)
      setRoles([])
    }
  }, [])

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll()
    } catch (err) {
      // Ignore logout errors
    } finally {
      safeRemoveItem('accessToken')
      setUser(null)
      setRoles([])
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const res = await authApi.refreshToken()
      if (res?.accessToken) {
        safeSetItem('accessToken', res.accessToken)
        return await reloadUser()
      }
    } catch (err) {
      safeRemoveItem('accessToken')
      setUser(null)
      setRoles([])
    }
    return null
  }, [reloadUser])

  const isAuthenticated = !!user
  const isAdmin =
    roles.some(r =>
      ['Admin', 'SuperAdmin', 'admin', 'superadmin'].includes(r)
    ) ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin'
  const isSuperAdmin =
    roles.some(r => ['SuperAdmin', 'superadmin'].includes(r)) ||
    user?.role === 'SuperAdmin' ||
    user?.isSuperAdmin === true

  const value = useMemo(
    () => ({
      user,
      roles,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      isLoading,
      login,
      register,
      logout,
      logoutAll,
      refreshSession,
      reloadUser
    }),
    [
      user,
      roles,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      isLoading,
      login,
      register,
      logout,
      logoutAll,
      refreshSession,
      reloadUser
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth () {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
