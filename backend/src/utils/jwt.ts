import type { AppBindings } from '../types/bindings'
import type { AccessTokenPayload, AuthUser } from '../types/auth'
import { base64UrlToBytes, bytesToBase64Url, safeEqual } from './crypto'

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24

async function signPayload(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return bytesToBase64Url(new Uint8Array(signature))
}

function getJwtSecret(bindings: AppBindings): string {
  const secret = bindings.JWT_SECRET?.trim()
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.')
  }

  return secret
}

export async function createAccessToken(bindings: AppBindings, user: AuthUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: AccessTokenPayload = {
    sub: user.membershipNumber,
    email: user.email,
    role: user.role,
    type: 'access',
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
  }

  const payloadEncoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await signPayload(getJwtSecret(bindings), payloadEncoded)
  return `${payloadEncoded}.${signature}`
}

export async function verifyAccessToken(bindings: AppBindings, token: string): Promise<AccessTokenPayload | null> {
  const [payloadPart, signaturePart] = token.split('.')
  if (!payloadPart || !signaturePart) {
    return null
  }

  const expectedSignature = await signPayload(getJwtSecret(bindings), payloadPart)
  const expectedBytes = base64UrlToBytes(expectedSignature)
  const receivedBytes = base64UrlToBytes(signaturePart)

  if (!safeEqual(expectedBytes, receivedBytes)) {
    return null
  }

  let payload: unknown
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadPart)))
  } catch {
    return null
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  const sub = 'sub' in payload ? payload.sub : undefined
  const email = 'email' in payload ? payload.email : undefined
  const role = 'role' in payload ? payload.role : undefined
  const type = 'type' in payload ? payload.type : undefined
  const exp = 'exp' in payload ? payload.exp : undefined

  if (
    typeof sub !== 'string' ||
    typeof email !== 'string' ||
    typeof role !== 'string' ||
    type !== 'access' ||
    typeof exp !== 'number' ||
    !Number.isFinite(exp)
  ) {
    return null
  }

  if (exp <= Math.floor(Date.now() / 1000)) {
    return null
  }

  return {
    sub,
    email,
    role,
    type: 'access',
    exp,
    iat: 'iat' in payload && typeof payload.iat === 'number' ? payload.iat : 0,
  }
}

export function accessTokenToAuthUser(payload: AccessTokenPayload): AuthUser {
  return {
    membershipNumber: payload.sub,
    email: payload.email,
    role: payload.role,
  }
}
