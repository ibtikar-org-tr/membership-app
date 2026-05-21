const MS_PER_DAY = 86_400_000
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000
export const DEFAULT_CRON_TIMEZONE = 'Europe/Istanbul'
const ISTANBUL_OFFSET = '+03:00'

/** No Telegram sends between 22:00 and 07:00 (Istanbul local time). */
export const CRON_SILENCE_HOURS = { start: 22, end: 7 } as const

export function getCronTimezone(timezone?: string): string {
  const value = timezone?.trim()
  return value || DEFAULT_CRON_TIMEZONE
}

export function isCronDryRun(dryRun?: string): boolean {
  return dryRun?.trim().toLowerCase() === 'true'
}

export function getLocalYmd(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
}

export function getYesterdayYmd(now: Date, timeZone: string): string {
  return addDaysToYmd(getLocalYmd(now, timeZone), -1)
}

export function addDaysToYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const utc = Date.UTC(year, month - 1, day + days)
  return utc.toISOString().slice(0, 10)
}

/** Whole calendar days between two YYYY-MM-DD strings (timezone-agnostic date math). */
export function daysBetweenYmd(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split('-').map(Number)
  const [ty, tm, td] = toYmd.split('-').map(Number)
  const from = Date.UTC(fy, fm - 1, fd)
  const to = Date.UTC(ty, tm - 1, td)
  return Math.floor((to - from) / MS_PER_DAY)
}

export function wholeDaysSince(isoTimestamp: string, now: Date, timeZone: string): number {
  return daysBetweenYmd(getLocalYmd(new Date(isoTimestamp), timeZone), getLocalYmd(now, timeZone))
}

export function remainingDaysUntilDue(
  dueDate: string | null,
  now: Date,
  timeZone: string,
): number | null {
  if (!dueDate?.trim()) {
    return null
  }

  const dueYmd = dueDate.trim().slice(0, 10)
  const todayYmd = getLocalYmd(now, timeZone)
  return daysBetweenYmd(todayYmd, dueYmd)
}

export function getTaskReminderIntervalDays(remainingDays: number | null): number {
  if (remainingDays === null || remainingDays < 0 || remainingDays < 8) {
    return 1
  }

  return Math.max(1, Math.floor(remainingDays / 4))
}

export function isTaskReminderDue(
  lastRemindedAt: string | null,
  dueDate: string | null,
  now: Date,
  timeZone: string,
): boolean {
  if (!lastRemindedAt) {
    return true
  }

  const intervalDays = getTaskReminderIntervalDays(remainingDaysUntilDue(dueDate, now, timeZone))
  return wholeDaysSince(lastRemindedAt, now, timeZone) >= intervalDays
}

export function alreadySentOwnerReportToday(
  lastReportedAt: string | null,
  now: Date,
  timeZone: string,
): boolean {
  if (!lastReportedAt) {
    return false
  }

  return getLocalYmd(new Date(lastReportedAt), timeZone) === getLocalYmd(now, timeZone)
}

/**
 * Silence window in local time. Default 22:00–07:00 crosses midnight:
 * quiet when hour >= start OR hour < end.
 */
export function isSilenceHours(
  now: Date,
  timeZone: string,
  startHour: number,
  endHour: number,
): boolean {
  const hour = getLocalHour(now, timeZone)

  if (startHour === endHour) {
    return false
  }

  if (startHour < endHour) {
    return hour >= startHour && hour < endHour
  }

  return hour >= startHour || hour < endHour
}

/** UTC ISO bounds for [ymd 00:00, next day 00:00) in the given IANA timezone. */
export function getLocalDayUtcBounds(ymd: string, timeZone: string): { start: string; end: string } {
  const start = findZonedMidnightUtc(ymd, timeZone)
  const end = findZonedMidnightUtc(addDaysToYmd(ymd, 1), timeZone)
  return { start: start.toISOString(), end: end.toISOString() }
}

function findZonedMidnightUtc(ymd: string, timeZone: string): Date {
  if (timeZone === DEFAULT_CRON_TIMEZONE) {
    const istanbul = new Date(`${ymd}T00:00:00${ISTANBUL_OFFSET}`)
    if (!Number.isNaN(istanbul.getTime())) {
      return istanbul
    }
  }

  const [year, month, day] = ymd.split('-').map(Number)
  const noonUtc = Date.UTC(year, month - 1, day, 12, 0, 0)

  for (let offsetHours = -18; offsetHours <= 18; offsetHours++) {
    const probe = new Date(noonUtc + offsetHours * 3_600_000)
    if (getLocalYmd(probe, timeZone) === ymd && getLocalHour(probe, timeZone) === 0) {
      return probe
    }
  }

  return new Date(`${ymd}T00:00:00${ISTANBUL_OFFSET}`)
}

export function getLocalHour(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  }).format(date)
  return Number(hour)
}

/** Formats an instant in the cron timezone (shows +03:00 for Istanbul). */
export function formatLocalDateTime(iso: string, timeZone: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return new Intl.DateTimeFormat('ar', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZoneName: 'shortOffset',
  }).format(date)
}

export function isEventCalendarReminderDue(
  startTimeIso: string,
  offsetDays: number,
  now: Date,
  timeZone: string,
): boolean {
  const eventYmd = getLocalYmd(new Date(startTimeIso), timeZone)
  const reminderYmd = addDaysToYmd(eventYmd, -offsetDays)
  return getLocalYmd(now, timeZone) === reminderYmd
}

export function isEventInstantReminderDue(
  startTimeIso: string,
  offsetHours: number,
  now: Date,
): boolean {
  const startMs = new Date(startTimeIso).getTime()
  if (Number.isNaN(startMs)) {
    return false
  }

  const triggerMs = startMs - offsetHours * 3_600_000
  const windowStartMs = now.getTime() - FIFTEEN_MINUTES_MS
  const nowMs = now.getTime()
  return triggerMs > windowStartMs && triggerMs <= nowMs
}

export function timestampInRange(
  value: string | null,
  start: string,
  end: string,
): boolean {
  if (!value?.trim()) {
    return false
  }

  const ms = new Date(value).getTime()
  if (Number.isNaN(ms)) {
    return false
  }

  return ms >= new Date(start).getTime() && ms < new Date(end).getTime()
}
