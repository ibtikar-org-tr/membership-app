import type { D1DatabaseLike } from '../types/bindings'

export const ACTIVE_EVENT_REGISTRATION_STATUSES = ['registered', 'attended'] as const

export type ActiveEventRegistrationStatus = (typeof ACTIVE_EVENT_REGISTRATION_STATUSES)[number]

export function isActiveEventRegistrationStatus(status: string): status is ActiveEventRegistrationStatus {
  return (ACTIVE_EVENT_REGISTRATION_STATUSES as readonly string[]).includes(status)
}

interface RegistrationCountState {
  ticketId: string
  status: string
}

export async function adjustTicketActiveRegistrationCount(
  db: D1DatabaseLike,
  ticketId: string,
  delta: 1 | -1,
): Promise<void> {
  await db
    .prepare(
      `UPDATE event_tickets
       SET active_registration_count = CASE
         WHEN active_registration_count + ? < 0 THEN 0
         ELSE active_registration_count + ?
       END,
       updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(delta, delta, ticketId)
    .run()
}

export async function applyRegistrationCountTransition(
  db: D1DatabaseLike,
  before: RegistrationCountState | null,
  after: RegistrationCountState | null,
): Promise<void> {
  if (before && isActiveEventRegistrationStatus(before.status)) {
    await adjustTicketActiveRegistrationCount(db, before.ticketId, -1)
  }

  if (after && isActiveEventRegistrationStatus(after.status)) {
    await adjustTicketActiveRegistrationCount(db, after.ticketId, 1)
  }
}

export async function getTicketActiveRegistrationCount(db: D1DatabaseLike, ticketId: string): Promise<number> {
  const row = await db
    .prepare('SELECT active_registration_count FROM event_tickets WHERE id = ?')
    .bind(ticketId)
    .first<{ active_registration_count: number }>()

  return Number(row?.active_registration_count ?? 0)
}

export function stripTicketActiveRegistrationCounts<T extends { activeRegistrationCount?: number }>(
  tickets: T[],
): Omit<T, 'activeRegistrationCount'>[] {
  return tickets.map(({ activeRegistrationCount: _activeRegistrationCount, ...ticket }) => ticket)
}
