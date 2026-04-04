import type { D1DatabaseLike } from '../types/bindings'

const START_SEQUENCE_NUMBER = 1
const SEQUENCE_DIGIT_LENGTH = 3

export async function generateUniqueMembershipNumber(db: D1DatabaseLike, prefix: string): Promise<string> {
  const effectivePrefix = prefix?.trim()
  if (!effectivePrefix) {
    throw new Error('Membership number prefix is required. Please contact the administrator.')
  }

  const lastUser = await db
    .prepare('SELECT membership_number FROM users ORDER BY created_at DESC, rowid DESC LIMIT 1')
    .bind()
    .first<{ membership_number: string }>()

  if (!lastUser?.membership_number || !lastUser.membership_number.startsWith(effectivePrefix)) {
    return `${effectivePrefix}${String(START_SEQUENCE_NUMBER).padStart(SEQUENCE_DIGIT_LENGTH, '0')}`
  }

  const lastSequenceRaw = lastUser.membership_number.slice(effectivePrefix.length)
  if (!/^\d+$/.test(lastSequenceRaw)) {
    return `${effectivePrefix}${String(START_SEQUENCE_NUMBER).padStart(SEQUENCE_DIGIT_LENGTH, '0')}`
  }

  const lastSequence = Number.parseInt(lastSequenceRaw, 10)

  if (!Number.isFinite(lastSequence)) {
    return `${effectivePrefix}${String(START_SEQUENCE_NUMBER).padStart(SEQUENCE_DIGIT_LENGTH, '0')}`
  }

  const nextSequence = lastSequence + 1
  return `${effectivePrefix}${String(nextSequence).padStart(SEQUENCE_DIGIT_LENGTH, '0')}`
}
