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
  image_url: string | null
  associated_urls: string | null
  created_by: string
  project_id: string | null
  project_name: string | null
  project_owner: string | null
  skills: string | null
  telegram_group_id: string | null
  country: string | null
  region: string | null
  city: string | null
  address: string | null
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

function parseJsonObject(data: string | null): Record<string, unknown> | null {
  if (!data) {
    return null
  }

  try {
    const parsed = JSON.parse(data)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }

    return parsed as Record<string, unknown>
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
    imageUrl: row.image_url,
    associatedUrls: parseJsonObject(row.associated_urls),
    createdBy: row.created_by,
    projectId: row.project_id,
    projectName: row.project_name,
    projectOwner: row.project_owner,
    skills: parseSkills(row.skills),
    telegramGroupId: row.telegram_group_id,
    country: row.country,
    region: row.region,
    city: row.city,
    address: row.address,
  }
}

export async function listEvents(db: D1DatabaseLike) {
  const result = await db
    .prepare(
      `SELECT
         events.id,
         events.created_at,
         events.updated_at,
         events.name,
         events.description,
         events.start_time,
         events.end_time,
         events.location,
         events.image_url,
         events.associated_urls,
         events.created_by,
         events.project_id,
         projects.name AS project_name,
         projects.owner AS project_owner,
         events.skills,
         events.telegram_group_id,
         events.country,
         events.region,
         events.city,
         events.address
       FROM events
       LEFT JOIN projects ON projects.id = events.project_id
       ORDER BY events.created_at DESC`,
    )
    .bind()
    .all<EventRow>()

  return result.results.map(mapEventRow)
}

export async function getEventById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare(
      `SELECT
         events.id,
         events.created_at,
         events.updated_at,
         events.name,
         events.description,
         events.start_time,
         events.end_time,
         events.location,
         events.image_url,
         events.associated_urls,
         events.created_by,
         events.project_id,
         projects.name AS project_name,
         projects.owner AS project_owner,
         events.skills,
         events.telegram_group_id,
         events.country,
         events.region,
         events.city,
         events.address
       FROM events
       LEFT JOIN projects ON projects.id = events.project_id
       WHERE events.id = ?`,
    )
    .bind(id)
    .first<EventRow>()

  return row ? mapEventRow(row) : null
}

export async function createEvent(db: D1DatabaseLike, id: string, input: CreateEventInput) {
  await db
    .prepare(
      'INSERT INTO events (id, name, description, start_time, end_time, location, image_url, associated_urls, created_by, project_id, skills, telegram_group_id, country, region, city, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      input.name,
      input.description ?? null,
      input.startTime ?? null,
      input.endTime ?? null,
      input.location ?? null,
      input.imageUrl ?? null,
      input.associatedUrls ? JSON.stringify(input.associatedUrls) : null,
      input.createdBy,
      input.projectId ?? null,
      input.skills ? JSON.stringify(input.skills) : null,
      input.telegramGroupId ?? null,
      input.country ?? null,
      input.region ?? null,
      input.city ?? null,
      input.address ?? null,
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

  if (input.imageUrl !== undefined) {
    updates.push('image_url = ?')
    values.push(input.imageUrl ?? null)
  }

  if (input.associatedUrls !== undefined) {
    updates.push('associated_urls = ?')
    values.push(input.associatedUrls ? JSON.stringify(input.associatedUrls) : null)
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

  if (input.country !== undefined) {
    updates.push('country = ?')
    values.push(input.country ?? null)
  }

  if (input.region !== undefined) {
    updates.push('region = ?')
    values.push(input.region ?? null)
  }

  if (input.city !== undefined) {
    updates.push('city = ?')
    values.push(input.city ?? null)
  }

  if (input.address !== undefined) {
    updates.push('address = ?')
    values.push(input.address ?? null)
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
