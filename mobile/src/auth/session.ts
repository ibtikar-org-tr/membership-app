import * as SecureStore from 'expo-secure-store'
import type { AuthUser } from '@/src/types/auth'

const ACCESS_TOKEN_KEY = 'membership-access-token'
const REFRESH_TOKEN_KEY = 'membership-refresh-token'
const USER_KEY = 'membership-auth-user'

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY)
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
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, params.accessToken)
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(params.user))

  if (params.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, params.refreshToken)
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ])
}

export async function hasSession(): Promise<boolean> {
  const token = await getAccessToken()
  return Boolean(token?.trim())
}
