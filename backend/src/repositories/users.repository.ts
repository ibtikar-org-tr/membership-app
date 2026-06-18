import type { D1DatabaseLike } from '../types/bindings'
import type { CreateUserParams } from '../schemas/user.schemas'

interface UserAuthRow {
  membership_number: string
  email: string
  password_hash: string
  role: string
}

export async function getLatestMembershipNumber(
  db: D1DatabaseLike,
  prefix: string,
): Promise<string | null> {
  const effectivePrefix = prefix.trim()
  if (!effectivePrefix) {
    return null
  }

  const result = await db
    .prepare('SELECT membership_number FROM users WHERE membership_number LIKE ?')
    .bind(`${effectivePrefix}%`)
    .all<{ membership_number: string }>()

  let latestMembershipNumber: string | null = null
  let latestSequence = -1

  for (const row of result.results) {
    const membershipNumber = row.membership_number
    if (!membershipNumber.startsWith(effectivePrefix)) {
      continue
    }

    const sequenceRaw = membershipNumber.slice(effectivePrefix.length)
    if (!/^\d+$/.test(sequenceRaw)) {
      continue
    }

    const sequence = Number.parseInt(sequenceRaw, 10)
    if (!Number.isFinite(sequence) || sequence <= latestSequence) {
      continue
    }

    latestSequence = sequence
    latestMembershipNumber = membershipNumber
  }

  return latestMembershipNumber
}

export async function createUser(db: D1DatabaseLike, params: CreateUserParams): Promise<void> {
  await db
    .prepare('INSERT INTO users (membership_number, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .bind(params.membershipNumber, params.email, params.passwordHash, params.role)
    .run()
}

export async function getUserByEmail(db: D1DatabaseLike, email: string): Promise<UserAuthRow | null> {
  const normalizedEmail = email.trim().toLowerCase()

  return db
    .prepare('SELECT membership_number, email, password_hash, role FROM users WHERE email = ? LIMIT 1')
    .bind(normalizedEmail)
    .first<UserAuthRow>()
}

export async function getUserByMembershipNumber(
  db: D1DatabaseLike,
  membershipNumber: string,
): Promise<UserAuthRow | null> {
  const normalizedMembershipNumber = membershipNumber.trim()

  return db
    .prepare('SELECT membership_number, email, password_hash, role FROM users WHERE membership_number = ? LIMIT 1')
    .bind(normalizedMembershipNumber)
    .first<UserAuthRow>()
}

export async function deleteUserByMembershipNumber(db: D1DatabaseLike, membershipNumber: string): Promise<void> {
  await db.prepare('DELETE FROM users WHERE membership_number = ?').bind(membershipNumber).run()
}

export async function updateUserPasswordHash(
  db: D1DatabaseLike,
  membershipNumber: string,
  passwordHash: string,
): Promise<void> {
  await db
    .prepare('UPDATE users SET password_hash = ? WHERE membership_number = ?')
    .bind(passwordHash, membershipNumber)
    .run()
}

export async function addToUserPointBalance(
  db: D1DatabaseLike,
  membershipNumber: string,
  delta: number,
): Promise<void> {
  if (!Number.isFinite(delta) || delta === 0) {
    return
  }

  await db
    .prepare('UPDATE users SET point_balance = point_balance + ? WHERE membership_number = ?')
    .bind(Math.trunc(delta), membershipNumber.trim())
    .run()
}

export async function getUserPointBalance(
  db: D1DatabaseLike,
  membershipNumber: string,
): Promise<number | null> {
  const row = await db
    .prepare('SELECT point_balance FROM users WHERE membership_number = ? LIMIT 1')
    .bind(membershipNumber.trim())
    .first<{ point_balance: number }>()

  return row?.point_balance ?? null
}
