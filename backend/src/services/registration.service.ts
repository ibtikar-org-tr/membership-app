import { EmailAlreadyExistsError } from '../errors/registration.errors'
import type { RegistrationInput } from '../schemas/registration'
import type { AppBindings } from '../types/bindings'
import { generateUniqueMembershipNumber } from '../utils/membership-number'
import { hashPassword } from '../utils/password'

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
  const membershipNumber = await generateUniqueMembershipNumber(db, bindings.MEMBERSHIP_NUMBER_PREFIX)
  const passwordHash = await hashPassword(input.password)

  try {
    await db
      .prepare('INSERT INTO users (membership_number, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .bind(membershipNumber, input.email, passwordHash, 'member')
      .run()
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.email')) {
      throw new EmailAlreadyExistsError()
    }
    throw error
  }

  try {
    await db
      .prepare(
        `INSERT INTO user_info (
          membership_number,
          en_name,
          ar_name,
          phone_number,
          sex,
          date_of_birth,
          country,
          region,
          city,
          address,
          education_level,
          school,
          field_of_study,
          graduation_year,
          blood_type,
          telegram_id,
          telegram_username,
          social_media_links,
          profile_picture_url,
          biography,
          interests,
          skills,
          languages
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        membershipNumber,
        input.enName,
        input.arName,
        input.phoneNumber ?? null,
        input.sex ?? null,
        input.dateOfBirth ?? null,
        input.country ?? null,
        input.region ?? null,
        input.city ?? null,
        input.address ?? null,
        input.educationLevel ?? null,
        input.school ?? null,
        input.fieldOfStudy ?? null,
        input.graduationYear ?? null,
        input.bloodType ?? null,
        input.telegramId ?? null,
        input.telegramUsername ?? null,
        toJsonOrNull(input.socialMediaLinks),
        input.profilePictureUrl ?? null,
        input.biography ?? null,
        toCsvOrNull(input.interests),
        toCsvOrNull(input.skills),
        toCsvOrNull(input.languages),
      )
      .run()

    await db
      .prepare(
        `INSERT INTO user_registration_info (
          membership_number,
          where_heard_about_us,
          motivation_letter,
          friends_on_platform,
          interest_in_volunteering,
          previous_experience
        ) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        membershipNumber,
        input.whereHeardAboutUs ?? null,
        input.motivationLetter ?? null,
        toCsvOrNull(input.friendsOnPlatform),
        input.interestInVolunteering ?? null,
        input.previousExperience ?? null,
      )
      .run()
  } catch (error) {
    await db.prepare('DELETE FROM users WHERE membership_number = ?').bind(membershipNumber).run()
    throw error
  }

  return { membershipNumber }
}
