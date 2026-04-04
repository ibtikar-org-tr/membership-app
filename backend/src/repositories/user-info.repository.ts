import type { D1DatabaseLike } from '../types/bindings'

export interface CreateUserInfoParams {
  membershipNumber: string
  enName: string
  arName: string
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
