import type { CreateSkillInput, UpdateSkillInput } from '../schemas/vms-skill.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface SkillRow {
  name: string
  created_at: string
  updated_at: string
  description: string | null
  members: number | null
  events: number | null
  tasks: number | null
}

function mapSkillRow(row: SkillRow) {
  return {
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    description: row.description,
    members: row.members,
    events: row.events,
    tasks: row.tasks,
  }
}

export async function listSkills(db: D1DatabaseLike) {
  const result = await db
    .prepare('SELECT name, created_at, updated_at, description, members, events, tasks FROM skills ORDER BY name ASC')
    .bind()
    .all<SkillRow>()

  return result.results.map(mapSkillRow)
}

export async function getSkillByName(db: D1DatabaseLike, name: string) {
  const row = await db
    .prepare('SELECT name, created_at, updated_at, description, members, events, tasks FROM skills WHERE name = ?')
    .bind(name)
    .first<SkillRow>()

  return row ? mapSkillRow(row) : null
}

export async function createSkill(db: D1DatabaseLike, input: CreateSkillInput) {
  await db
    .prepare('INSERT INTO skills (name, description, members, events, tasks) VALUES (?, ?, ?, ?, ?)')
    .bind(input.name, input.description ?? null, input.members ?? null, input.events ?? null, input.tasks ?? null)
    .run()

  return getSkillByName(db, input.name)
}

export async function updateSkillByName(db: D1DatabaseLike, name: string, input: UpdateSkillInput) {
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

  if (input.members !== undefined) {
    updates.push('members = ?')
    values.push(input.members)
  }

  if (input.events !== undefined) {
    updates.push('events = ?')
    values.push(input.events)
  }

  if (input.tasks !== undefined) {
    updates.push('tasks = ?')
    values.push(input.tasks)
  }

  if (updates.length === 0) {
    return getSkillByName(db, name)
  }

  updates.push("updated_at = datetime('now')")

  await db
    .prepare(`UPDATE skills SET ${updates.join(', ')} WHERE name = ?`)
    .bind(...values, name)
    .run()

  const nextName = input.name ?? name
  return getSkillByName(db, nextName)
}

export async function deleteSkillByName(db: D1DatabaseLike, name: string) {
  const existing = await getSkillByName(db, name)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM skills WHERE name = ?').bind(name).run()
  return true
}
