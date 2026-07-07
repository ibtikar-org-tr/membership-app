import { Hono } from 'hono'
import { getLeaderboardEntryForMember, listLeaderboard } from '../repositories/users.repository'
import type { AppEnv } from '../types/hono'
import { getActorMembershipNumber } from '../utils/actor'

const LEADERBOARD_LIMIT = 5

export const vmsLeaderboardRoute = new Hono<AppEnv>()

vmsLeaderboardRoute.get('/leaderboard', async (c) => {
  try {
    const actorMembershipNumber = getActorMembershipNumber(c)

    const [entries, viewerEntry] = await Promise.all([
      listLeaderboard(c.env.MEMBERS_DB, LEADERBOARD_LIMIT),
      getLeaderboardEntryForMember(c.env.MEMBERS_DB, actorMembershipNumber),
    ])

    const viewerInTopFive = entries.some((entry) => entry.membershipNumber === actorMembershipNumber)

    return c.json({
      entries: entries.map((entry) => ({
        name: entry.displayName,
        points: entry.points,
        ...(entry.membershipNumber === actorMembershipNumber ? { isViewer: true } : {}),
      })),
      viewer:
        viewerEntry && !viewerInTopFive
          ? {
              rank: viewerEntry.rank,
              points: viewerEntry.points,
            }
          : null,
    })
  } catch (error) {
    console.error('Failed to fetch leaderboard', error)
    return c.json({ error: 'Could not fetch leaderboard.' }, 500)
  }
})
