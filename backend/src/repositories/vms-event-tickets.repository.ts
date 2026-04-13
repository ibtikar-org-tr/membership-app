import type { CreateEventTicketInput, UpdateEventTicketInput } from '../schemas/vms-event-ticket.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface EventTicketRow {
  id: string
  created_at: string
  updated_at: string
  event_id: string
  name: string
  description: string | null
  point_price: number
  currency_price: string | null
  quantity: number
}

function mapEventTicketRow(row: EventTicketRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    eventId: row.event_id,
    name: row.name,
    description: row.description,
    pointPrice: row.point_price,
    currencyPrice: row.currency_price,
    quantity: row.quantity,
  }
}

export async function listEventTickets(db: D1DatabaseLike, eventId?: string) {
  const query = eventId
    ? 'SELECT id, created_at, updated_at, event_id, name, description, point_price, currency_price, quantity FROM event_tickets WHERE event_id = ? ORDER BY created_at DESC'
    : 'SELECT id, created_at, updated_at, event_id, name, description, point_price, currency_price, quantity FROM event_tickets ORDER BY created_at DESC'

  const statement = db.prepare(query)
  const result = eventId ? await statement.bind(eventId).all<EventTicketRow>() : await statement.bind().all<EventTicketRow>()

  return result.results.map(mapEventTicketRow)
}

export async function getEventTicketById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare('SELECT id, created_at, updated_at, event_id, name, description, point_price, currency_price, quantity FROM event_tickets WHERE id = ?')
    .bind(id)
    .first<EventTicketRow>()

  return row ? mapEventTicketRow(row) : null
}

export async function createEventTicket(db: D1DatabaseLike, id: string, input: CreateEventTicketInput) {
  await db
    .prepare('INSERT INTO event_tickets (id, event_id, name, description, point_price, currency_price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, input.eventId, input.name, input.description ?? null, input.pointPrice, input.currencyPrice ?? null, input.quantity)
    .run()

  return getEventTicketById(db, id)
}

export async function updateEventTicketById(db: D1DatabaseLike, id: string, input: UpdateEventTicketInput) {
  const updates: string[] = []
  const values: unknown[] = []

  if (input.eventId !== undefined) {
    updates.push('event_id = ?')
    values.push(input.eventId)
  }

  if (input.name !== undefined) {
    updates.push('name = ?')
    values.push(input.name)
  }

  if (input.description !== undefined) {
    updates.push('description = ?')
    values.push(input.description)
  }

  if (input.pointPrice !== undefined) {
    updates.push('point_price = ?')
    values.push(input.pointPrice)
  }

  if (input.currencyPrice !== undefined) {
    updates.push('currency_price = ?')
    values.push(input.currencyPrice)
  }

  if (input.quantity !== undefined) {
    updates.push('quantity = ?')
    values.push(input.quantity)
  }

  if (updates.length === 0) {
    return getEventTicketById(db, id)
  }

  updates.push("updated_at = datetime('now')")

  await db
    .prepare(`UPDATE event_tickets SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  return getEventTicketById(db, id)
}

export async function deleteEventTicketById(db: D1DatabaseLike, id: string) {
  const existing = await getEventTicketById(db, id)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM event_tickets WHERE id = ?').bind(id).run()
  return true
}

export async function getTicketWithEventInfo(db: D1DatabaseLike, ticketId: string) {
  interface TicketWithEventRow {
    event_id: string
    project_id: string | null
  }

  const row = await db
    .prepare('SELECT e.id as event_id, e.project_id FROM event_tickets t JOIN events e ON t.event_id = e.id WHERE t.id = ?')
    .bind(ticketId)
    .first<TicketWithEventRow>()

  return row ? { eventId: row.event_id, projectId: row.project_id } : null
}
