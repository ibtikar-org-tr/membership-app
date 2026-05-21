import type { AppBindings } from '../types/bindings'
import {
  CRON_SILENCE_HOURS,
  getCronTimezone,
  getLocalHour,
  isCronDryRun,
  isSilenceHours,
} from '../utils/cron-timezone'
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
    silenceHours: CRON_SILENCE_HOURS,
  }

  const stats = emptyStats()

  console.log('[cron] run started', {
    startedAt,
    timeZone: ctx.timeZone,
    localHour: getLocalHour(now, timeZone),
    silenceHours: `${CRON_SILENCE_HOURS.start}:00–${CRON_SILENCE_HOURS.end}:00`,
    dryRun: ctx.dryRun,
  })

  if (isSilenceHours(now, timeZone, CRON_SILENCE_HOURS.start, CRON_SILENCE_HOURS.end)) {
    console.log('[cron] silence hours — skipping all notifications', {
      localHour: getLocalHour(now, timeZone),
    })
    return stats
  }

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
