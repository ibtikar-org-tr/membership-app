import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getUserProfileByMembershipNumber } from '../repositories/user-info.repository'
import type { AppBindings } from '../types/bindings'

const profileParamsSchema = z.object({
  membershipNumber: z.string().trim().min(1),
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
