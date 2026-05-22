import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../types/hono'
import { accessTokenToAuthUser, verifyAccessToken } from '../utils/jwt'

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = await verifyAccessToken(c.env, token)
    if (!payload) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('authUser', accessTokenToAuthUser(payload))
    await next()
  } catch (error) {
    console.error('Auth middleware failed', error)
    return c.json({ error: 'Unauthorized' }, 401)
  }
}
