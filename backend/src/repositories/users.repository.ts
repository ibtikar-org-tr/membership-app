import type { D1DatabaseLike } from '../types/bindings'
import type { CreateUserParams } from '../schemas/user.schemas'

interface UserAuthRow {
  membership_number: string
  email: string
  password_hash: string
  role: string
}

export async function getLatestMembershipNumber(db: D1DatabaseLike): Promise<string | null> {
  const row = await db
    .prepare('SELECT membership_number FROM users ORDER BY created_at DESC, rowid DESC LIMIT 1')
    .bind()
    .first<{ membership_number: string }>()

  return row?.membership_number ?? null
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
