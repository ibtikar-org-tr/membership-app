import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { logout as logoutRequest } from '@/src/api/auth'
import { getStoredUser, hasSession } from '@/src/auth/session'
import type { AuthUser } from '@/src/types/auth'

type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  refreshAuth: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)

  const refreshAuth = useCallback(async () => {
    const signedIn = await hasSession()
    if (!signedIn) {
      setUser(null)
      setStatus('signedOut')
      return
    }

    const storedUser = await getStoredUser()
    setUser(storedUser)
    setStatus(storedUser ? 'signedIn' : 'signedOut')
  }, [])

  const signOut = useCallback(async () => {
    await logoutRequest()
    setUser(null)
    setStatus('signedOut')
  }, [])

  useEffect(() => {
    void refreshAuth()
  }, [refreshAuth])

  const value = useMemo(
    () => ({
      status,
      user,
      refreshAuth,
      signOut,
    }),
    [refreshAuth, signOut, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
