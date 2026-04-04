const START_SEQUENCE_NUMBER = 1
const SEQUENCE_DIGIT_LENGTH = 3

export function generateNextMembershipNumber(lastMembershipNumber: string | null, prefix: string): string {
  const effectivePrefix = prefix?.trim()
  if (!effectivePrefix) {
    throw new Error('Membership number prefix is required. Please contact the administrator.')
  }

  if (!lastMembershipNumber || !lastMembershipNumber.startsWith(effectivePrefix)) {
    return `${effectivePrefix}${String(START_SEQUENCE_NUMBER).padStart(SEQUENCE_DIGIT_LENGTH, '0')}`
  }

  const lastSequenceRaw = lastMembershipNumber.slice(effectivePrefix.length)
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
