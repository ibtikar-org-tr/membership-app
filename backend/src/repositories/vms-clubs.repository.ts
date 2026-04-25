import type { CreateClubInput, UpdateClubInput } from '../schemas/vms-club.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface ClubRow {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  project_id: string
  image_url: string | null
  telegram_group_id: string | null
  country: string | null
  region: string | null
  city: string | null
  address: string | null
  visibility: string
  join_policy: string
  skills: string | null
}

export interface ClubRecord {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description: string | null
  projectId: string
  imageUrl: string | null
  telegramGroupId: string | null
  country: string | null
  region: string | null
  city: string | null
  address: string | null
  visibility: string
  joinPolicy: string
  skills: Record<string, string> | null
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

function mapClubRow(row: ClubRow): ClubRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    description: row.description,
    projectId: row.project_id,
    imageUrl: row.image_url,
    telegramGroupId: row.telegram_group_id,
    country: row.country,
    region: row.region,
    city: row.city,
    address: row.address,
    visibility: row.visibility,
    joinPolicy: row.join_policy,
    skills: parseSkills(row.skills),
  }
}

export async function listClubs(db: D1DatabaseLike, projectId?: string) {
  const query = projectId
    ? 'SELECT id, created_at, updated_at, name, description, project_id, image_url, telegram_group_id, country, region, city, address, visibility, join_policy, skills FROM clubs WHERE project_id = ? ORDER BY created_at DESC'
    : 'SELECT id, created_at, updated_at, name, description, project_id, image_url, telegram_group_id, country, region, city, address, visibility, join_policy, skills FROM clubs ORDER BY created_at DESC'

  const statement = db.prepare(query)
  const result = projectId ? await statement.bind(projectId).all<ClubRow>() : await statement.bind().all<ClubRow>()
  return result.results.map(mapClubRow)
}

export async function getClubById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare('SELECT id, created_at, updated_at, name, description, project_id, image_url, telegram_group_id, country, region, city, address, visibility, join_policy, skills FROM clubs WHERE id = ?')
    .bind(id)
    .first<ClubRow>()

  return row ? mapClubRow(row) : null
}

export async function createClub(db: D1DatabaseLike, id: string, input: CreateClubInput) {
  await db
    .prepare(
      'INSERT INTO clubs (id, name, description, project_id, image_url, telegram_group_id, country, region, city, address, visibility, join_policy, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      input.name,
      input.description ?? null,
      input.projectId,
      input.imageUrl ?? null,
      input.telegramGroupId ?? null,
      input.country ?? null,
      input.region ?? null,
      input.city ?? null,
      input.address ?? null,
      input.visibility,
      input.joinPolicy,
      input.skills ? JSON.stringify(input.skills) : null,
    )
    .run()

  return getClubById(db, id)
}

export async function updateClubById(db: D1DatabaseLike, id: string, input: UpdateClubInput) {
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

  if (input.imageUrl !== undefined) {
    updates.push('image_url = ?')
    values.push(input.imageUrl ?? null)
  }

  if (input.telegramGroupId !== undefined) {
    updates.push('telegram_group_id = ?')
    values.push(input.telegramGroupId ?? null)
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

  if (input.visibility !== undefined) {
    updates.push('visibility = ?')
    values.push(input.visibility)
  }

  if (input.joinPolicy !== undefined) {
    updates.push('join_policy = ?')
    values.push(input.joinPolicy)
  }

  if (input.skills !== undefined) {
    updates.push('skills = ?')
    values.push(input.skills ? JSON.stringify(input.skills) : null)
  }

  if (updates.length === 0) {
    return getClubById(db, id)
  }

  updates.push("updated_at = datetime('now')")

  await db
    .prepare(`UPDATE clubs SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  return getClubById(db, id)
}

export async function deleteClubById(db: D1DatabaseLike, id: string) {
  const existing = await getClubById(db, id)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM clubs WHERE id = ?').bind(id).run()
  return true
}
