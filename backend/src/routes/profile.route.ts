import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getUserProfileByMembershipNumber, updateUserInfo } from '../repositories/user-info.repository'
import type { AppBindings } from '../types/bindings'

const profileParamsSchema = z.object({
  membershipNumber: z.string().trim().min(1),
})

const updateProfileSchema = z.object({
  enName: z.string().optional(),
  arName: z.string().optional(),
  sex: z.enum(['male', 'female']).optional(),
  dateOfBirth: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  educationLevel: z.string().optional(),
  school: z.string().optional(),
  graduationYear: z.number().optional(),
  fieldOfStudy: z.string().optional(),
  bloodType: z.string().optional(),
  socialMediaLinks: z.string().optional(),
  biography: z.string().optional(),
  interests: z.string().optional(),
  skills: z.string().optional(),
  languages: z.string().optional(),
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
      return c.json({ error: 'Could not update profile.' }, 500)
    }
  },
)
