import { Hono } from 'hono'
import { getLeaderboardEntryForMember, listLeaderboard } from '../repositories/users.repository'
import type { AppEnv } from '../types/hono'
import { getActorMembershipNumber } from '../utils/actor'

export const vmsLeaderboardRoute = new Hono<AppEnv>()

vmsLeaderboardRoute.get('/leaderboard', async (c) => {
  try {
    const limitRaw = Number(c.req.query('limit') ?? 50)
    const limit = Number.isFinite(limitRaw) ? limitRaw : 50
    const actorMembershipNumber = getActorMembershipNumber(c)

    const [entries, currentUser] = await Promise.all([
      listLeaderboard(c.env.MEMBERS_DB, limit),
      getLeaderboardEntryForMember(c.env.MEMBERS_DB, actorMembershipNumber),
    ])

    return c.json({ entries, currentUser })
  } catch (error) {
    console.error('Failed to fetch leaderboard', error)
    return c.json({ error: 'Could not fetch leaderboard.' }, 500)
  }
})
