import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { EmailAlreadyExistsError, RegistrationEmailError } from '../errors/registration.errors'
import { registrationSchema } from '../schemas/registration'
import { registerUser } from '../services/registration.service'
import type { AppBindings } from '../types/bindings'

export const registrationRoute = new Hono<{ Bindings: AppBindings }>()

registrationRoute.post(
  '/registration',
  zValidator('json', registrationSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
          })),
        },
        400,
      )
    }
  }),
  async (c) => {
    try {
      const payload = c.req.valid('json')
      const result = await registerUser(c.env, payload)

      return c.json(
        {
          message: 'Registration completed successfully. Your temporary password has been sent to your email.',
          membershipNumber: result.membershipNumber,
        },
        201,
      )
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        return c.json({ error: error.message }, 409)
      }

      if (error instanceof RegistrationEmailError) {
        return c.json({ error: error.message }, 503)
      }

      console.error('Registration failed with unexpected error', error)

      return c.json({ error: 'Could not complete registration.' }, 500)
    }
  },
)
