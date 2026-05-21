import type { AppBindings } from '../types/bindings'
import { getCronTimezone, getLocalHour, isCronDryRun } from '../utils/cron-timezone'
import { runEventReminders } from './event-reminders'
import { runOwnerDailyReports } from './owner-daily-report'
import { runTaskReminders } from './task-reminders'
import type { CronContext, CronRunStats } from './types'

function emptyStats(): CronRunStats {
  return {
    taskReminders: { eligible: 0, sent: 0, skipped: 0 },
    ownerReports: { eligible: 0, sent: 0, skipped: 0 },
    eventReminders: { eligible: 0, sent: 0, skipped: 0 },
  }
}

export async function handleCron(bindings: AppBindings): Promise<CronRunStats> {
  const startedAt = new Date().toISOString()
  const now = new Date()
  const timeZone = getCronTimezone(bindings.CRON_TIMEZONE)
  const ctx: CronContext = {
    now,
    timeZone,
    dryRun: isCronDryRun(bindings.CRON_DRY_RUN),
  }

  const stats = emptyStats()

  console.log('[cron] run started', {
    startedAt,
    timeZone: ctx.timeZone,
    localHour: getLocalHour(now, timeZone),
    dryRun: ctx.dryRun,
  })

  try {
    await runTaskReminders(bindings, ctx, stats)
    await runOwnerDailyReports(bindings, ctx, stats)
    await runEventReminders(bindings, ctx, stats)
  } catch (error) {
    console.error('[cron] run failed', error)
    throw error
  }

  console.log('[cron] run completed', { startedAt, stats })
  return stats
}
