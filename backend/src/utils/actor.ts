import type { Context } from 'hono'
import type { AppEnv } from '../types/hono'

export function getActorMembershipNumber(c: Context<AppEnv>): string {
  return c.get('authUser').membershipNumber
}

export function getActorUser(c: Context<AppEnv>) {
  return c.get('authUser')
}
