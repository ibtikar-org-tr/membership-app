import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type { AuthUser } from '@/src/types/auth'

const ACCESS_TOKEN_KEY = 'membership-access-token'
const REFRESH_TOKEN_KEY = 'membership-refresh-token'
const USER_KEY = 'membership-auth-user'

const useLocalStorage = Platform.OS === 'web'

async function getItem(key: string): Promise<string | null> {
  if (useLocalStorage) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null
    } catch {
      return null
    }
  }

  return SecureStore.getItemAsync(key)
}

async function setItem(key: string, value: string): Promise<void> {
  if (useLocalStorage) {
    try {
      globalThis.localStorage?.setItem(key, value)
    } catch {
      // ignore quota / private mode failures
    }
    return
  }

  await SecureStore.setItemAsync(key, value)
}

async function deleteItem(key: string): Promise<void> {
  if (useLocalStorage) {
    try {
      globalThis.localStorage?.removeItem(key)
    } catch {
      // ignore
    }
    return
  }

  await SecureStore.deleteItemAsync(key)
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY)
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY)
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await getItem(USER_KEY)
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
      await clearSession()
      return null
    }

    return {
      membershipNumber: parsed.membershipNumber,
      email: parsed.email,
      role: parsed.role,
    }
  } catch {
    await clearSession()
    return null
  }
}

export async function setSession(params: {
  user: AuthUser
  accessToken: string
  refreshToken?: string
}): Promise<void> {
  await setItem(ACCESS_TOKEN_KEY, params.accessToken)
  await setItem(USER_KEY, JSON.stringify(params.user))

  if (params.refreshToken) {
    await setItem(REFRESH_TOKEN_KEY, params.refreshToken)
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    deleteItem(ACCESS_TOKEN_KEY),
    deleteItem(REFRESH_TOKEN_KEY),
    deleteItem(USER_KEY),
  ])
}

export async function hasSession(): Promise<boolean> {
  const token = await getAccessToken()
  return Boolean(token?.trim())
}
