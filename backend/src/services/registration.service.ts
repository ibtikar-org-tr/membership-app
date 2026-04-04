import { EmailAlreadyExistsError } from '../errors/registration.errors'
import { createUserInfo, deleteUserInfoByMembershipNumber } from '../repositories/user-info.repository'
import {
  createUserRegistrationInfo,
  deleteUserRegistrationInfoByMembershipNumber,
} from '../repositories/user-registration-info.repository'
import { createUser, deleteUserByMembershipNumber, getLatestMembershipNumber } from '../repositories/users.repository'
import type { RegistrationInput } from '../schemas/registration'
import { sendRegistrationCredentialsEmail } from './registration-email.service'
import type { AppBindings } from '../types/bindings'
import { generateNextMembershipNumber } from '../utils/membership-number'
import { generateTemporaryPassword, hashPassword } from '../utils/password'

export interface RegistrationResult {
  membershipNumber: string
}

function toCsvOrNull(items?: string[]): string | null {
  if (!items || items.length === 0) {
    return null
  }

  return items.join(', ')
}

function toJsonOrNull(value?: Record<string, string>): string | null {
  if (!value) {
    return null
  }

  return JSON.stringify(value)
}

export async function registerUser(bindings: AppBindings, input: RegistrationInput): Promise<RegistrationResult> {
  const db = bindings.MY_DB
  const lastMembershipNumber = await getLatestMembershipNumber(db)
  const membershipNumber = generateNextMembershipNumber(lastMembershipNumber, bindings.MEMBERSHIP_NUMBER_PREFIX)
  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await hashPassword(temporaryPassword)

  try {
    await createUser(db, {
      membershipNumber,
      email: input.email,
      passwordHash,
      role: 'member',
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.email')) {
      throw new EmailAlreadyExistsError()
    }
    throw error
  }

  try {
    await createUserInfo(db, {
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
      interests: toCsvOrNull(input.interests),
      skills: toCsvOrNull(input.skills),
      languages: toCsvOrNull(input.languages),
    })

    await createUserRegistrationInfo(db, {
      membershipNumber,
      whereHeardAboutUs: input.whereHeardAboutUs ?? null,
      motivationLetter: input.motivationLetter ?? null,
      friendsOnPlatform: toCsvOrNull(input.friendsOnPlatform),
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
      deleteUserRegistrationInfoByMembershipNumber(db, membershipNumber),
      deleteUserInfoByMembershipNumber(db, membershipNumber),
      deleteUserByMembershipNumber(db, membershipNumber),
    ])
    throw error
  }

  return { membershipNumber }
}
