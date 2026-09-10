import type { D1DatabaseLike } from '../types/bindings'
import { sha256Hex } from '../utils/crypto'

export async function isPasswordResetTokenUsed(db: D1DatabaseLike, token: string): Promise<boolean> {
  const tokenHash = await sha256Hex(token)
  const row = await db
    .prepare('SELECT 1 AS used FROM used_password_reset_tokens WHERE token_hash = ? LIMIT 1')
    .bind(tokenHash)
    .first<{ used: number }>()

  return Boolean(row)
}

/** Marks a reset token as consumed. Returns false if it was already used. */
export async function consumePasswordResetToken(
  db: D1DatabaseLike,
  token: string,
  membershipNumber: string,
  expiresAtUnixSeconds: number,
): Promise<boolean> {
  const tokenHash = await sha256Hex(token)
  const expiresAt = new Date(expiresAtUnixSeconds * 1000).toISOString()

  const result = (await db
    .prepare(
      `INSERT OR IGNORE INTO used_password_reset_tokens (token_hash, membership_number, expires_at)
       VALUES (?, ?, ?)`,
    )
    .bind(tokenHash, membershipNumber, expiresAt)
    .run()) as { meta?: { changes?: number } }

  return (result.meta?.changes ?? 0) > 0
}
