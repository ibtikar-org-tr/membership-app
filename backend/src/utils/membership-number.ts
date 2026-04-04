import type { D1DatabaseLike } from '../types/bindings'

const MAX_GENERATION_ATTEMPTS = 10
const RANDOM_DIGIT_LENGTH = 8

function randomDigits(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => (byte % 10).toString()).join('')
}

export async function generateUniqueMembershipNumber(db: D1DatabaseLike, prefix: string): Promise<string> {
  const effectivePrefix = prefix?.trim()
  if (!effectivePrefix) {
    throw new Error('Membership number prefix is required. Please contact the administrator.')
  }

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = `${effectivePrefix}${randomDigits(RANDOM_DIGIT_LENGTH)}`

    const exists = await db
      .prepare('SELECT membership_number FROM users WHERE membership_number = ? LIMIT 1')
      .bind(candidate)
      .first<{ membership_number: string }>()

    if (!exists) {
      return candidate
    }
  }

  throw new Error('Unable to generate a unique membership number. Please contact the administrator.')
}
