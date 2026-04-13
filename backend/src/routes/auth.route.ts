import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getUserByEmail, getUserByMembershipNumber } from '../repositories/users.repository'
import { loginSchema } from '../schemas/auth.schema'
import type { AppBindings } from '../types/bindings'
import { verifyPassword } from '../utils/password'

export const authRoute = new Hono<{ Bindings: AppBindings }>()

authRoute.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const identifier = payload.identifier.trim()
    const isEmailIdentifier = identifier.includes('@')

    const user = isEmailIdentifier
      ? await getUserByEmail(c.env.MEMBERS_DB, identifier)
      : await getUserByMembershipNumber(c.env.MEMBERS_DB, identifier)

    if (!user) {
      return c.json({ error: 'Invalid email or password.' }, 401)
    }

    const passwordOk = await verifyPassword(payload.password, user.password_hash)
    if (!passwordOk) {
      return c.json({ error: 'Invalid email or password.' }, 401)
    }

    return c.json({
      user: {
        membershipNumber: user.membership_number,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Failed to login', error)
    return c.json({ error: 'Could not log in.' }, 500)
  }
})
