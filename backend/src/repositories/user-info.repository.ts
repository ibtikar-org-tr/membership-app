import type { D1DatabaseLike } from '../types/bindings'
import type { CreateUserInfoParams } from '../schemas/user.schemas'

interface UserProfileRow {
  membershipNumber: string
  email: string
  role: string
  enName: string | null
  arName: string | null
  phoneNumber: string | null
  sex: string | null
  dateOfBirth: string | null
  country: string | null
  region: string | null
  city: string | null
  address: string | null
  educationLevel: string | null
  school: string | null
  fieldOfStudy: string | null
  graduationYear: number | null
  bloodType: string | null
  telegramId: string | null
  telegramUsername: string | null
  socialMediaLinks: string | null
  profilePictureUrl: string | null
  biography: string | null
  interests: string | null
  skills: string | null
  languages: string | null
}

interface UserDisplayNameRow {
  membership_number: string
  email: string | null
  en_name: string | null
  ar_name: string | null
}

export async function createUserInfo(db: D1DatabaseLike, params: CreateUserInfoParams): Promise<void> {
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
      params.membershipNumber,
      params.enName,
      params.arName,
      params.phoneNumber,
      params.sex,
      params.dateOfBirth,
      params.country,
      params.region,
      params.city,
      params.address,
      params.educationLevel,
      params.school,
      params.fieldOfStudy,
      params.graduationYear,
      params.bloodType,
      params.telegramId,
      params.telegramUsername,
      params.socialMediaLinks,
      params.profilePictureUrl,
      params.biography,
      params.interests,
      params.skills,
      params.languages,
    )
    .run()
}

export async function deleteUserInfoByMembershipNumber(db: D1DatabaseLike, membershipNumber: string): Promise<void> {
  await db.prepare('DELETE FROM user_info WHERE membership_number = ?').bind(membershipNumber).run()
}

export async function phoneNumberExists(db: D1DatabaseLike, phoneNumber: string): Promise<boolean> {
  const result = await db
    .prepare('SELECT 1 FROM user_info WHERE phone_number = ? LIMIT 1')
    .bind(phoneNumber)
    .first()
  return !!result
}

export async function getUserProfileByMembershipNumber(
  db: D1DatabaseLike,
  membershipNumber: string,
): Promise<UserProfileRow | null> {
  return db
    .prepare(
      `SELECT
        u.membership_number AS membershipNumber,
        u.email AS email,
        u.role AS role,
        ui.en_name AS enName,
        ui.ar_name AS arName,
        ui.phone_number AS phoneNumber,
        ui.sex AS sex,
        ui.date_of_birth AS dateOfBirth,
        ui.country AS country,
        ui.region AS region,
        ui.city AS city,
        ui.address AS address,
        ui.education_level AS educationLevel,
        ui.school AS school,
        ui.field_of_study AS fieldOfStudy,
        ui.graduation_year AS graduationYear,
        ui.blood_type AS bloodType,
        ui.telegram_id AS telegramId,
        ui.telegram_username AS telegramUsername,
        ui.social_media_links AS socialMediaLinks,
        ui.profile_picture_url AS profilePictureUrl,
        ui.biography AS biography,
        ui.interests AS interests,
        ui.skills AS skills,
        ui.languages AS languages
      FROM users u
      LEFT JOIN user_info ui ON ui.membership_number = u.membership_number
      WHERE u.membership_number = ?
      LIMIT 1`
    )
    .bind(membershipNumber)
    .first<UserProfileRow>()
}

export async function getUserDisplayNamesByMembershipNumbers(
  db: D1DatabaseLike,
  membershipNumbers: string[],
): Promise<Map<string, string>> {
  const uniqueMembershipNumbers = [...new Set(membershipNumbers.map((value) => value.trim()).filter(Boolean))]

  if (uniqueMembershipNumbers.length === 0) {
    return new Map()
  }

  const placeholders = uniqueMembershipNumbers.map(() => '?').join(', ')
  const rows = await db
    .prepare(
      `SELECT
        u.membership_number,
        u.email,
        ui.en_name,
        ui.ar_name
      FROM users u
      LEFT JOIN user_info ui ON ui.membership_number = u.membership_number
      WHERE u.membership_number IN (${placeholders})`
    )
    .bind(...uniqueMembershipNumbers)
    .all<UserDisplayNameRow>()

  const displayNameMap = new Map<string, string>()

  for (const row of rows.results) {
    const displayName =
      row.en_name?.trim() || row.ar_name?.trim() || row.email?.trim() || row.membership_number

    displayNameMap.set(row.membership_number, displayName)
  }

  return displayNameMap
}
