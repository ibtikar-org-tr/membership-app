import { Hono } from 'hono'
import { getMemberStats } from '../repositories/stats.repository'
import type { AppBindings } from '../types/bindings'

export const statsRoute = new Hono<{ Bindings: AppBindings }>()

statsRoute.get('/stats', async (c) => {
  try {
    const stats = await getMemberStats(c.env.MY_DB, c.env.MEMBERSHIP_NUMBER_PREFIX)

    return c.json({
      overview: {
        totalMembers: stats.totalMembers,
        cycleGrowthPercentage: stats.cycleGrowthPercentage,
        telegramActive: stats.telegramActive,
        newMembers: stats.newMembers,
        countriesCount: stats.countriesCount,
        universitiesCount: stats.universitiesCount,
      },
      genderDistribution: {
        maleCount: stats.maleCount,
        femaleCount: stats.femaleCount,
        malePercentage: stats.malePercentage,
        femalePercentage: stats.femalePercentage,
      },
      ageDistribution: stats.ageDistribution,
    })
  } catch (error) {
    console.error('Failed to fetch membership stats', error)
    return c.json({ error: 'Could not fetch membership stats.' }, 500)
  }
})