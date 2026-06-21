import type { AuthUser } from '../types/auth'

const AUTH_USER_STORAGE_KEY = 'membership-auth-user-v1'
const AUTH_ACCESS_STORAGE_KEY = 'membership-auth-access-v1'

export function isPlatformAdmin(user: AuthUser | null): boolean {
  return user?.role?.trim().toLowerCase() === 'admin'
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const token = window.localStorage.getItem(AUTH_ACCESS_STORAGE_KEY)?.trim()
  return token || null
}

export function setAccessToken(token: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_ACCESS_STORAGE_KEY, token)
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>

    if (
      typeof parsed.membershipNumber !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.role !== 'string' ||
      !parsed.membershipNumber.trim() ||
      !parsed.email.trim() ||
      !parsed.role.trim()
    ) {
      clearStoredAuth()
      return null
    }

    return {
      membershipNumber: parsed.membershipNumber,
      email: parsed.email,
      role: parsed.role,
    }
  } catch {
    clearStoredAuth()
    return null
  }
}

export function setStoredUser(user: AuthUser) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
}

export function setStoredSession(user: AuthUser, accessToken: string) {
  setStoredUser(user)
  setAccessToken(accessToken)
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_ACCESS_STORAGE_KEY)
}

/** @deprecated Use clearStoredAuth */
export function clearStoredUser() {
  clearStoredAuth()
}

/** Accepts only same-app relative paths; blocks open redirects and login loops. */
export function getSafeRedirectPath(path: string | null | undefined): string | null {
  if (!path) {
    return null
  }

  const trimmed = path.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return null
  }

  const pathname = trimmed.split(/[?#]/)[0]
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return null
  }

  return trimmed
}
