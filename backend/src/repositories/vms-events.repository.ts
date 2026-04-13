import type { CreateEventInput, UpdateEventInput } from '../schemas/vms-event.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface EventRow {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  created_by: string
  project_id: string | null
  skills: string | null
  telegram_group_id: string | null
}

function parseSkills(skills: string | null): Record<string, string> | null {
  if (!skills) {
    return null
  }

  try {
    const parsed = JSON.parse(skills)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => {
        const [key, value] = entry
        return typeof key === 'string' && typeof value === 'string'
      }),
    )
  } catch {
    return null
  }
}

function mapEventRow(row: EventRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    createdBy: row.created_by,
    projectId: row.project_id,
    skills: parseSkills(row.skills),
    telegramGroupId: row.telegram_group_id,
  }
}

export async function listEvents(db: D1DatabaseLike) {
  const result = await db
    .prepare(
      'SELECT id, created_at, updated_at, name, description, start_time, end_time, location, created_by, project_id, skills, telegram_group_id FROM events ORDER BY created_at DESC',
    )
    .bind()
    .all<EventRow>()

  return result.results.map(mapEventRow)
}

export async function getEventById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare(
      'SELECT id, created_at, updated_at, name, description, start_time, end_time, location, created_by, project_id, skills, telegram_group_id FROM events WHERE id = ?',
    )
    .bind(id)
    .first<EventRow>()

  return row ? mapEventRow(row) : null
}

export async function createEvent(db: D1DatabaseLike, id: string, input: CreateEventInput) {
  await db
    .prepare(
      'INSERT INTO events (id, name, description, start_time, end_time, location, created_by, project_id, skills, telegram_group_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      input.name,
      input.description ?? null,
      input.startTime ?? null,
      input.endTime ?? null,
      input.location ?? null,
      input.createdBy,
      input.projectId ?? null,
      input.skills ? JSON.stringify(input.skills) : null,
      input.telegramGroupId ?? null,
    )
    .run()

  return getEventById(db, id)
}

export async function updateEventById(db: D1DatabaseLike, id: string, input: UpdateEventInput) {
  const updates: string[] = []
  const values: unknown[] = []

  if (input.name !== undefined) {
    updates.push('name = ?')
    values.push(input.name)
  }

  if (input.description !== undefined) {
    updates.push('description = ?')
    values.push(input.description)
  }

  if (input.startTime !== undefined) {
    updates.push('start_time = ?')
    values.push(input.startTime)
  }

  if (input.endTime !== undefined) {
    updates.push('end_time = ?')
    values.push(input.endTime)
  }

  if (input.location !== undefined) {
    updates.push('location = ?')
    values.push(input.location)
  }

  if (input.createdBy !== undefined) {
    updates.push('created_by = ?')
    values.push(input.createdBy)
  }

  if (input.projectId !== undefined) {
    updates.push('project_id = ?')
    values.push(input.projectId)
  }

  if (input.skills !== undefined) {
    updates.push('skills = ?')
    values.push(input.skills ? JSON.stringify(input.skills) : null)
  }

  if (input.telegramGroupId !== undefined) {
    updates.push('telegram_group_id = ?')
    values.push(input.telegramGroupId)
  }

  if (updates.length === 0) {
    return getEventById(db, id)
  }

  updates.push("updated_at = datetime('now')")

  await db
    .prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  return getEventById(db, id)
}

export async function deleteEventById(db: D1DatabaseLike, id: string) {
  const existing = await getEventById(db, id)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run()
  return true
}
