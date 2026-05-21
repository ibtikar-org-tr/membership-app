import { sendBackendTelegramNotification } from '../services/telegram-notification.service'
import type { AppBindings } from '../types/bindings'
import { generateId } from '../utils/id'
import {
  formatLocalDateTime,
  isEventCalendarReminderDue,
  isEventInstantReminderDue,
} from '../utils/cron-timezone'
import { filterMembersWithTelegram, getFrontendEventUrl } from './members'
import type { CronContext, CronRunStats, EventReminderKind, EventReminderRow } from './types'

const CALENDAR_OFFSETS: Array<{ kind: EventReminderKind; days: number }> = [
  { kind: '7d', days: 7 },
  { kind: '3d', days: 3 },
  { kind: '1d', days: 1 },
]

const INSTANT_OFFSETS: Array<{ kind: EventReminderKind; hours: number }> = [
  { kind: '3h', hours: 3 },
  { kind: '1h', hours: 1 },
]

const REMINDER_LABELS: Record<EventReminderKind, string> = {
  '7d': 'بعد أسبوع',
  '3d': 'بعد 3 أيام',
  '1d': 'غداً',
  '3h': 'بعد 3 ساعات',
  '1h': 'بعد ساعة',
}

interface RegistrationRow {
  event_id: string
  event_name: string
  start_time: string
  city: string | null
  address: string | null
  associated_urls: string | null
  membership_number: string
}

function parseMapUrl(associatedUrls: string | null): string | null {
  if (!associatedUrls?.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(associatedUrls) as Record<string, unknown>
    const map = parsed.map
    return typeof map === 'string' && map.trim() ? map.trim() : null
  } catch {
    return null
  }
}

function buildLocation(city: string | null, address: string | null): string | null {
  const parts = [city?.trim(), address?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(' — ') : null
}

function buildEventReminderMessage(
  bindings: AppBindings,
  row: EventReminderRow,
  timeZone: string,
) {
  const name = row.event_name.replace(/[*_]/g, '').trim()
  const when = formatLocalDateTime(row.start_time, timeZone)
  const label = REMINDER_LABELS[row.reminder_kind]

  let message = `📅 تذكير: *${name}*\n\n⏰ ${when}\n🔔 ${label}`

  const location = buildLocation(row.city, row.address)
  if (location) {
    message += `\n📍 ${location}`
  }

  const boxes: Array<{ text: string; link: string }> = []
  const eventUrl = getFrontendEventUrl(bindings, row.event_id)
  if (eventUrl) {
    boxes.push({ text: 'تفاصيل الفعالية', link: eventUrl })
  }

  const mapUrl = parseMapUrl(row.associated_urls)
  if (mapUrl) {
    boxes.push({ text: 'الموقع على الخريطة', link: mapUrl })
  }

  return { message, boxes }
}

async function fetchRegistrations(bindings: AppBindings): Promise<RegistrationRow[]> {
  const result = await bindings.VMS_DB.prepare(
    `SELECT
      e.id AS event_id,
      e.name AS event_name,
      e.start_time,
      e.city,
      e.address,
      e.associated_urls,
      er.membership_number
    FROM events e
    INNER JOIN event_registrations er ON er.event_id = e.id
    WHERE e.status = 'public'
      AND e.start_time IS NOT NULL
      AND datetime(e.start_time) > datetime('now')
      AND er.status = 'registered'`,
  )
    .bind()
    .all<RegistrationRow>()

  return result.results
}

async function hasReminderLog(
  bindings: AppBindings,
  eventId: string,
  recipient: string,
  reminderKind: EventReminderKind,
): Promise<boolean> {
  const row = await bindings.VMS_LOGS_DB.prepare(
    `SELECT 1 AS found FROM cron_notification_log
     WHERE job_type = 'event_reminder'
       AND entity_type = 'event'
       AND entity_id = ?
       AND recipient = ?
       AND reminder_kind = ?
     LIMIT 1`,
  )
    .bind(eventId, recipient, reminderKind)
    .first<{ found: number }>()

  return Boolean(row?.found)
}

async function insertReminderLog(
  bindings: AppBindings,
  eventId: string,
  recipient: string,
  reminderKind: EventReminderKind,
  sentAt: string,
) {
  await bindings.VMS_LOGS_DB.prepare(
    `INSERT INTO cron_notification_log (id, job_type, entity_type, entity_id, recipient, reminder_kind, sent_at)
     VALUES (?, 'event_reminder', 'event', ?, ?, ?, ?)`,
  )
    .bind(generateId(), eventId, recipient, reminderKind, sentAt)
    .run()
}

function collectDueReminders(
  rows: RegistrationRow[],
  ctx: CronContext,
): EventReminderRow[] {
  const due: EventReminderRow[] = []

  for (const row of rows) {
    for (const { kind, days } of CALENDAR_OFFSETS) {
      if (isEventCalendarReminderDue(row.start_time, days, ctx.now, ctx.timeZone)) {
        due.push({ ...row, reminder_kind: kind })
      }
    }

    for (const { kind, hours } of INSTANT_OFFSETS) {
      if (isEventInstantReminderDue(row.start_time, hours, ctx.now)) {
        due.push({ ...row, reminder_kind: kind })
      }
    }
  }

  return due
}

export async function runEventReminders(
  bindings: AppBindings,
  ctx: CronContext,
  stats: CronRunStats,
): Promise<void> {
  const registrations = await fetchRegistrations(bindings)
  const due = collectDueReminders(registrations, ctx)

  if (due.length === 0) {
    return
  }

  const withTelegram = await filterMembersWithTelegram(
    bindings.MEMBERS_DB,
    due.map((row) => row.membership_number),
  )

  const sentAt = ctx.now.toISOString()

  for (const row of due) {
    stats.eventReminders.eligible++

    if (!withTelegram.has(row.membership_number)) {
      stats.eventReminders.skipped++
      continue
    }

    if (await hasReminderLog(bindings, row.event_id, row.membership_number, row.reminder_kind)) {
      stats.eventReminders.skipped++
      continue
    }

    const { message, boxes } = buildEventReminderMessage(bindings, row, ctx.timeZone)

    if (ctx.dryRun) {
      console.log('[cron:dry-run] event reminder', {
        eventId: row.event_id,
        member: row.membership_number,
        kind: row.reminder_kind,
      })
      stats.eventReminders.sent++
      continue
    }

    const result = await sendBackendTelegramNotification(bindings, {
      target: row.membership_number,
      message,
      ...(boxes.length > 0 ? { boxes } : {}),
    })

    if (!result.success) {
      console.warn('[cron] event reminder failed', {
        eventId: row.event_id,
        member: row.membership_number,
        kind: row.reminder_kind,
        result,
      })
      stats.eventReminders.skipped++
      continue
    }

    await insertReminderLog(bindings, row.event_id, row.membership_number, row.reminder_kind, sentAt)
    stats.eventReminders.sent++
  }
}
