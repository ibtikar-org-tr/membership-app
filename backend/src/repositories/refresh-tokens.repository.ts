import type { D1DatabaseLike } from '../types/bindings'
import { randomToken, sha256Hex } from '../utils/crypto'

const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30

interface RefreshTokenRow {
  id: string
  membership_number: string
  token_hash: string
  expires_at: string
  revoked_at: string | null
}

export interface RefreshTokenRecord {
  id: string
  membershipNumber: string
  token: string
  expiresAt: string
}

function expiresAtIso(): string {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString()
}

export async function createRefreshToken(
  db: D1DatabaseLike,
  membershipNumber: string,
): Promise<RefreshTokenRecord> {
  const id = crypto.randomUUID()
  const token = randomToken(32)
  const tokenHash = await sha256Hex(token)
  const expiresAt = expiresAtIso()

  await db
    .prepare(
      `INSERT INTO refresh_tokens (id, membership_number, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, membershipNumber, tokenHash, expiresAt)
    .run()

  return {
    id,
    membershipNumber,
    token,
    expiresAt,
  }
}

export async function findValidRefreshToken(
  db: D1DatabaseLike,
  token: string,
): Promise<RefreshTokenRow | null> {
  const tokenHash = await sha256Hex(token)

  const row = await db
    .prepare(
      `SELECT id, membership_number, token_hash, expires_at, revoked_at
       FROM refresh_tokens
       WHERE token_hash = ?
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<RefreshTokenRow>()

  if (!row || row.revoked_at) {
    return null
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return null
  }

  return row
}

export async function revokeRefreshToken(db: D1DatabaseLike, token: string): Promise<void> {
  const tokenHash = await sha256Hex(token)

  await db
    .prepare(`UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE token_hash = ?`)
    .bind(tokenHash)
    .run()
}

export async function revokeRefreshTokenById(db: D1DatabaseLike, id: string): Promise<void> {
  await db
    .prepare(`UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE id = ?`)
    .bind(id)
    .run()
}
