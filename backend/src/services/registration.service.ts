import {
  EmailAlreadyExistsError,
  MembershipNumberAllocationError,
  PhoneNumberAlreadyExistsError,
} from '../errors/registration.errors'
import { createUserInfo, deleteUserInfoByMembershipNumber, phoneNumberExists } from '../repositories/user-info.repository'
import {
  createUserRegistrationInfo,
  deleteUserRegistrationInfoByMembershipNumber,
} from '../repositories/user-registration-info.repository'
import { createUser, deleteUserByMembershipNumber, getLatestMembershipNumber } from '../repositories/users.repository'
import {
  deleteAllUserSkillsByMembershipNumber,
  upsertUserSkill,
} from '../repositories/user-skills.repository'
import { createSkill, getSkillByName } from '../repositories/vms-skills.repository'
import type { RegistrationInput } from '../schemas/registration'
import { sendRegistrationCredentialsEmail } from './registration-email.service'
import type { AppBindings } from '../types/bindings'
import { generateNextMembershipNumber } from '../utils/membership-number'
import { generateTemporaryPassword, hashPassword } from '../utils/password'
import { generateId } from '../utils/id'

export interface RegistrationResult {
  membershipNumber: string
}

function toJsonOrNull(value?: Record<string, string>): string | null {
  if (!value) {
    return null
  }

  return JSON.stringify(value)
}

function uniqueTrimmedValues(values: string[]) {
  const seen = new Set<string>()
  const uniqueValues: string[] = []

  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) {
      continue
    }

    const dedupeKey = trimmed.toLocaleLowerCase()
    if (seen.has(dedupeKey)) {
      continue
    }

    seen.add(dedupeKey)
    uniqueValues.push(trimmed)
  }

  return uniqueValues
}

const MEMBERSHIP_NUMBER_ALLOCATION_ATTEMPTS = 5

function isMembershipNumberConflict(error: unknown) {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed: users.membership_number')
}

function isEmailConflict(error: unknown) {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed: users.email')
}

async function createUserWithMembershipRetry(
  membersDb: AppBindings['MEMBERS_DB'],
  prefix: string,
  params: {
    email: string
    passwordHash: string
    role: string
  },
) {
  for (let attempt = 0; attempt < MEMBERSHIP_NUMBER_ALLOCATION_ATTEMPTS; attempt += 1) {
    const lastMembershipNumber = await getLatestMembershipNumber(membersDb, prefix)
    const membershipNumber = generateNextMembershipNumber(lastMembershipNumber, prefix)

    try {
      await createUser(membersDb, {
        membershipNumber,
        email: params.email,
        passwordHash: params.passwordHash,
        role: params.role,
      })
      return membershipNumber
    } catch (error) {
      if (isEmailConflict(error)) {
        throw new EmailAlreadyExistsError()
      }

      if (isMembershipNumberConflict(error) && attempt < MEMBERSHIP_NUMBER_ALLOCATION_ATTEMPTS - 1) {
        continue
      }

      if (isMembershipNumberConflict(error)) {
        throw new MembershipNumberAllocationError()
      }

      throw error
    }
  }

  throw new MembershipNumberAllocationError()
}

async function getOrCreateSkill(vmsDb: AppBindings['VMS_DB'], skillName: string): Promise<string> {
  const existing = await getSkillByName(vmsDb, skillName)
  if (existing) {
    return existing.id
  }

  const skillId = generateId()
  await createSkill(vmsDb, {
    id: skillId,
    name: skillName,
  })

  return skillId
}

async function saveRegistrationSkills(
  membersDb: AppBindings['MEMBERS_DB'],
  vmsDb: AppBindings['VMS_DB'],
  membershipNumber: string,
  interests: string[],
  skills?: string[],
) {
  for (const interest of uniqueTrimmedValues(interests)) {
    const skillId = await getOrCreateSkill(vmsDb, interest)
    await upsertUserSkill(membersDb, membershipNumber, skillId, 'interest')
  }

  if (!skills || skills.length === 0) {
    return
  }

  for (const skillName of uniqueTrimmedValues(skills)) {
    const skillId = await getOrCreateSkill(vmsDb, skillName)
    await upsertUserSkill(membersDb, membershipNumber, skillId, 'skill', 'beginner')
  }
}

export async function registerUser(bindings: AppBindings, input: RegistrationInput): Promise<RegistrationResult> {
  const membersDb = bindings.MEMBERS_DB
  const vmsDb = bindings.VMS_DB
  const membershipPrefix = bindings.MEMBERSHIP_NUMBER_PREFIX
  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await hashPassword(temporaryPassword)

  if (input.phoneNumber) {
    const phoneExists = await phoneNumberExists(membersDb, input.phoneNumber)
    if (phoneExists) {
      throw new PhoneNumberAlreadyExistsError()
    }
  }

  const membershipNumber = await createUserWithMembershipRetry(membersDb, membershipPrefix, {
    email: input.email,
    passwordHash,
    role: 'member',
  })

  try {
    await createUserInfo(membersDb, {
      membershipNumber,
      enName: input.enName,
      arName: input.arName,
      phoneNumber: input.phoneNumber ?? null,
      sex: input.sex ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      country: input.country ?? null,
      region: input.region ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
      educationLevel: input.educationLevel ?? null,
      school: input.school ?? null,
      fieldOfStudy: input.fieldOfStudy ?? null,
      graduationYear: input.graduationYear ?? null,
      bloodType: input.bloodType ?? null,
      telegramId: null,
      telegramUsername: null,
      socialMediaLinks: toJsonOrNull(input.socialMediaLinks),
      profilePictureUrl: null,
      biography: input.biography ?? null,
      languages: input.languages ? input.languages.join(', ') : null,
    })

    await saveRegistrationSkills(membersDb, vmsDb, membershipNumber, input.interests, input.skills)

    await createUserRegistrationInfo(membersDb, {
      membershipNumber,
      whereHeardAboutUs: input.whereHeardAboutUs ?? null,
      motivationLetter: input.motivationLetter ?? null,
      friendsOnPlatform: input.friendsOnPlatform ? input.friendsOnPlatform.join(', ') : null,
      interestInVolunteering: input.interestInVolunteering ?? null,
      previousExperience: input.previousExperience ?? null,
    })

    await sendRegistrationCredentialsEmail(bindings, {
      recipientEmail: input.email,
      membershipNumber,
      temporaryPassword,
    })
  } catch (error) {
    await Promise.allSettled([
      deleteAllUserSkillsByMembershipNumber(membersDb, membershipNumber),
      deleteUserRegistrationInfoByMembershipNumber(membersDb, membershipNumber),
      deleteUserInfoByMembershipNumber(membersDb, membershipNumber),
      deleteUserByMembershipNumber(membersDb, membershipNumber),
    ])
    throw error
  }

  return { membershipNumber }
}
