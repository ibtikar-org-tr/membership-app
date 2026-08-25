import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from '@/src/auth/session'
import type { RefreshResponse } from '@/src/types/auth'

const configuredBase = process.env.EXPO_PUBLIC_API_BASE?.trim()
export const API_BASE = configuredBase
  ? configuredBase.replace(/\/+$/, '')
  : 'http://127.0.0.1:8787/ms/membership-app/api'

const MOBILE_CLIENT_HEADER = { 'X-Client': 'mobile' }

let refreshInFlight: Promise<boolean> | null = null

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const body = (await response.json()) as { error?: unknown; code?: unknown }
    if (typeof body.error === 'string' && body.error.trim()) {
      return { message: body.error, code: typeof body.code === 'string' ? body.code : undefined }
    }
  } catch {
    // ignore
  }

  return { message: fallbackMessage, code: undefined as string | undefined }
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight
  }

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) {
      return false
    }

    const response = await fetch(`${API_BASE}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...MOBILE_CLIENT_HEADER,
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      return false
    }

    const payload = (await response.json()) as RefreshResponse
    await setSession({
      user: payload.user,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    })
    return true
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('X-Client', 'mobile')

  const accessToken = await getAccessToken()
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  const isAuthEndpoint =
    path.startsWith('/login') || path.startsWith('/refresh') || path.startsWith('/logout')

  if (response.status === 401 && retryOnUnauthorized && !isAuthEndpoint) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return apiFetch(path, init, false)
    }

    await clearSession()
  }

  return response
}

export async function apiGetJson<T>(path: string): Promise<T> {
  const response = await apiFetch(path, { method: 'GET' })
  if (!response.ok) {
    const { message } = await parseErrorMessage(response, `Request failed (${response.status})`)
    throw new Error(message)
  }
  return (await response.json()) as T
}

export async function apiPostJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const { message, code } = await parseErrorMessage(response, `Request failed (${response.status})`)
    const error = new Error(message) as Error & { code?: string }
    if (code) {
      error.code = code
    }
    throw error
  }

  return (await response.json()) as TResponse
}

export { parseErrorMessage }
