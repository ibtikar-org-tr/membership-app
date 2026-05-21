export type EventReminderKind = '7d' | '3d' | '1d' | '3h' | '1h'

export interface CronContext {
  now: Date
  timeZone: string
  dryRun: boolean
  silenceHours: { start: number; end: number }
}

export interface CronRunStats {
  taskReminders: { eligible: number; sent: number; skipped: number }
  ownerReports: { eligible: number; sent: number; skipped: number }
  eventReminders: { eligible: number; sent: number; skipped: number }
}

export interface TaskReminderRow {
  id: string
  name: string
  project_id: string
  project_name: string
  assigned_to: string
  due_date: string | null
  priority: string | null
  last_reminded_at: string | null
}

export interface ProjectReportRow {
  id: string
  name: string
  owner: string
  last_reported_at: string | null
}

export interface EventReminderRow {
  event_id: string
  event_name: string
  start_time: string
  city: string | null
  address: string | null
  associated_urls: string | null
  membership_number: string
  reminder_kind: EventReminderKind
}
