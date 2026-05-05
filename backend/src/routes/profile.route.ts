import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getUserProfileByMembershipNumber, updateUserInfo } from '../repositories/user-info.repository'
import type { AppBindings } from '../types/bindings'

const profileParamsSchema = z.object({
  membershipNumber: z.string().trim().min(1),
})

const nullableStringField = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().nullable().optional(),
)

const updateProfileSchema = z.object({
  enName: nullableStringField,
  arName: nullableStringField,
  phoneNumber: nullableStringField,
  sex: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.enum(['male', 'female']).nullable().optional(),
  ),
  dateOfBirth: nullableStringField,
  country: nullableStringField,
  region: nullableStringField,
  city: nullableStringField,
  address: nullableStringField,
  educationLevel: nullableStringField,
  school: nullableStringField,
  graduationYear: z.number().optional(),
  fieldOfStudy: nullableStringField,
  bloodType: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable().optional(),
  ),
  socialMediaLinks: nullableStringField,
  biography: nullableStringField,
  interests: nullableStringField,
  skills: nullableStringField,
  languages: nullableStringField,
})

export const profileRoute = new Hono<{ Bindings: AppBindings }>()

profileRoute.get('/profile/:membershipNumber', zValidator('param', profileParamsSchema), async (c) => {
  try {
    const { membershipNumber } = c.req.valid('param')
    const profile = await getUserProfileByMembershipNumber(c.env.MEMBERS_DB, membershipNumber)

    if (!profile) {
      return c.json({ error: 'Profile not found.' }, 404)
    }

    return c.json({ profile })
  } catch (error) {
    console.error('Failed to fetch profile', error)
    return c.json({ error: 'Could not fetch profile.' }, 500)
  }
})

profileRoute.put(
  '/profile/:membershipNumber',
  zValidator('param', profileParamsSchema),
  zValidator('json', updateProfileSchema),
  async (c) => {
    try {
      const { membershipNumber } = c.req.valid('param')
      const payload = c.req.valid('json')

      await updateUserInfo(c.env.MEMBERS_DB, membershipNumber, payload)

      const profile = await getUserProfileByMembershipNumber(c.env.MEMBERS_DB, membershipNumber)

      if (!profile) {
        return c.json({ error: 'Profile not found.' }, 404)
      }

      return c.json({ profile })
    } catch (error) {
      console.error('Failed to update profile', error)
      const message = error instanceof Error ? error.message : ''

      if (message.includes('UNIQUE constraint failed: user_info.phone_number')) {
        return c.json({ error: 'Phone number is already used by another member.' }, 409)
      }

      if (message.includes('CHECK constraint failed')) {
        return c.json({ error: 'One or more profile fields contain invalid values.' }, 400)
      }

      return c.json({ error: 'Could not update profile.' }, 500)
    }
  },
)
