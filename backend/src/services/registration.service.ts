import { EmailAlreadyExistsError, PhoneNumberAlreadyExistsError } from '../errors/registration.errors'
import { createUserInfo, deleteUserInfoByMembershipNumber, phoneNumberExists } from '../repositories/user-info.repository'
import {
  createUserRegistrationInfo,
  deleteUserRegistrationInfoByMembershipNumber,
} from '../repositories/user-registration-info.repository'
import { createUser, deleteUserByMembershipNumber, getLatestMembershipNumber } from '../repositories/users.repository'
import {
  addUserSkill,
  deleteAllUserSkillsByMembershipNumber,
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

async function getOrCreateSkill(vmsDb: AppBindings['VMS_DB'], skillName: string): Promise<string> {
  // Try to find existing skill by name
  const existing = await getSkillByName(vmsDb, skillName)
  if (existing) {
    return existing.id
  }

  // Create new skill
  const skillId = generateId()
  await createSkill(vmsDb, {
    id: skillId,
    name: skillName,
  })

  return skillId
}

export async function registerUser(bindings: AppBindings, input: RegistrationInput): Promise<RegistrationResult> {
  const membersDb = bindings.MEMBERS_DB
  const vmsDb = bindings.VMS_DB
  const lastMembershipNumber = await getLatestMembershipNumber(membersDb)
  const membershipNumber = generateNextMembershipNumber(lastMembershipNumber, bindings.MEMBERSHIP_NUMBER_PREFIX)
  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await hashPassword(temporaryPassword)

  // Check if phone number already exists (if provided)
  if (input.phoneNumber) {
    const phoneExists = await phoneNumberExists(membersDb, input.phoneNumber)
    if (phoneExists) {
      throw new PhoneNumberAlreadyExistsError()
    }
  }

  try {
    await createUser(membersDb, {
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

    // Add interests to user_skills
    for (const interest of input.interests) {
      const skillId = await getOrCreateSkill(vmsDb, interest)
      await addUserSkill(membersDb, membershipNumber, skillId, 'interest')
    }

    // Add skills to user_skills (if provided)
    if (input.skills && input.skills.length > 0) {
      for (const skill of input.skills) {
        const skillId = await getOrCreateSkill(vmsDb, skill)
        await addUserSkill(membersDb, membershipNumber, skillId, 'skill', 'beginner')
      }
    }

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
