import type { D1DatabaseLike } from '../types/bindings'
import { CreateUserRegistrationInfoParams } from '../schemas/user.schemas'

export async function createUserRegistrationInfo(
  db: D1DatabaseLike,
  params: CreateUserRegistrationInfoParams,
): Promise<void> {
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
      params.membershipNumber,
      params.whereHeardAboutUs,
      params.motivationLetter,
      params.friendsOnPlatform,
      params.interestInVolunteering,
      params.previousExperience,
    )
    .run()
}
