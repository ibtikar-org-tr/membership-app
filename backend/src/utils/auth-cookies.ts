import type { Context } from 'hono'
import type { AppBindings } from '../types/bindings'

export const REFRESH_TOKEN_COOKIE = 'membership_refresh_token'

const REFRESH_COOKIE_PATH = '/ms/membership-app/api'

export function setRefreshTokenCookie(c: Context<{ Bindings: AppBindings }>, token: string, expiresAt: string) {
  const secure = new URL(c.req.url).protocol === 'https:'
  const expires = new Date(expiresAt).toUTCString()

  c.header(
    'Set-Cookie',
    `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure ? '; Secure' : ''}; Expires=${expires}`,
  )
}

export function clearRefreshTokenCookie(c: Context<{ Bindings: AppBindings }>) {
  const secure = new URL(c.req.url).protocol === 'https:'

  c.header(
    'Set-Cookie',
    `${REFRESH_TOKEN_COOKIE}=; Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`,
  )
}

export function getRefreshTokenFromCookie(c: Context<{ Bindings: AppBindings }>): string | null {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) {
    return null
  }

  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=')
    if (name === REFRESH_TOKEN_COOKIE) {
      const value = valueParts.join('=').trim()
      return value ? decodeURIComponent(value) : null
    }
  }

  return null
}
