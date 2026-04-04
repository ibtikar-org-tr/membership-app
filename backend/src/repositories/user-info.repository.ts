import type { D1DatabaseLike } from '../types/bindings'
import type { CreateUserInfoParams } from '../schemas/user.schemas'

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
