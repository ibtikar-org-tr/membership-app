import type { MemberProfile } from '@/src/types/profile'

const COMPLETION_FIELDS: Array<keyof MemberProfile | 'graduationYear'> = [
  'enName',
  'arName',
  'phoneNumber',
  'sex',
  'dateOfBirth',
  'country',
  'region',
  'city',
  'educationLevel',
  'school',
  'graduationYear',
  'fieldOfStudy',
  'skills',
  'interests',
  'languages',
]

export function calculateProfileCompletion(profile: MemberProfile | null): number {
  if (!profile) return 0

  const filledFields = COMPLETION_FIELDS.filter((field) => {
    const value = profile[field as keyof MemberProfile]
    if (value === undefined || value === null) return false
    return typeof value === 'string' ? value.trim() !== '' : true
  }).length

  return Math.round((filledFields / COMPLETION_FIELDS.length) * 100)
}
