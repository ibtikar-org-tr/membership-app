import type { CreateEventRegistrationInput, UpdateEventRegistrationInput } from '../schemas/vms-event-registration.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface EventRegistrationRow {
  id: string
  created_at: string
  updated_at: string
  event_id: string
  membership_number: string
  ticket_id: string
  status: string
  approved_by: string | null
}

function mapEventRegistrationRow(row: EventRegistrationRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    eventId: row.event_id,
    membershipNumber: row.membership_number,
    ticketId: row.ticket_id,
    status: row.status,
    approvedBy: row.approved_by,
  }
}

export async function listEventRegistrations(db: D1DatabaseLike, eventId?: string) {
  const query = eventId
    ? 'SELECT id, created_at, updated_at, event_id, membership_number, ticket_id, status, approved_by FROM event_registrations WHERE event_id = ? ORDER BY created_at DESC'
    : 'SELECT id, created_at, updated_at, event_id, membership_number, ticket_id, status, approved_by FROM event_registrations ORDER BY created_at DESC'

  const statement = db.prepare(query)
  const result = eventId ? await statement.bind(eventId).all<EventRegistrationRow>() : await statement.bind().all<EventRegistrationRow>()

  return result.results.map(mapEventRegistrationRow)
}

export async function getEventRegistrationById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare('SELECT id, created_at, updated_at, event_id, membership_number, ticket_id, status, approved_by FROM event_registrations WHERE id = ?')
    .bind(id)
    .first<EventRegistrationRow>()

  return row ? mapEventRegistrationRow(row) : null
}

export async function createEventRegistration(db: D1DatabaseLike, id: string, input: CreateEventRegistrationInput) {
  await db
    .prepare('INSERT INTO event_registrations (id, event_id, membership_number, ticket_id, status, approved_by) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, input.eventId, input.membershipNumber, input.ticketId, input.status, input.approvedBy ?? null)
    .run()

  return getEventRegistrationById(db, id)
}

export async function updateEventRegistrationById(db: D1DatabaseLike, id: string, input: UpdateEventRegistrationInput) {
  const updates: string[] = []
  const values: unknown[] = []

  if (input.eventId !== undefined) {
    updates.push('event_id = ?')
    values.push(input.eventId)
  }

  if (input.membershipNumber !== undefined) {
    updates.push('membership_number = ?')
    values.push(input.membershipNumber)
  }

  if (input.ticketId !== undefined) {
    updates.push('ticket_id = ?')
    values.push(input.ticketId)
  }

  if (input.status !== undefined) {
    updates.push('status = ?')
    values.push(input.status)
  }

  if (input.approvedBy !== undefined) {
    updates.push('approved_by = ?')
    values.push(input.approvedBy)
  }

  if (updates.length === 0) {
    return getEventRegistrationById(db, id)
  }

  updates.push("updated_at = datetime('now')")

  await db
    .prepare(`UPDATE event_registrations SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  return getEventRegistrationById(db, id)
}

export async function deleteEventRegistrationById(db: D1DatabaseLike, id: string) {
  const existing = await getEventRegistrationById(db, id)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM event_registrations WHERE id = ?').bind(id).run()
  return true
}
