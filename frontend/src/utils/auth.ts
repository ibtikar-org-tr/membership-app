import type { AuthUser } from '../types/auth'

const AUTH_STORAGE_KEY = 'membership-auth-user-v1'

export function isPlatformAdmin(user: AuthUser | null): boolean {
  return user?.role?.trim().toLowerCase() === 'admin'
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
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
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return {
      membershipNumber: parsed.membershipNumber,
      email: parsed.email,
      role: parsed.role,
    }
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function setStoredUser(user: AuthUser) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
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
