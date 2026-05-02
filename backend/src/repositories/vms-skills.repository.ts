import type { D1DatabaseLike } from '../types/bindings'

export interface Skill {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  description: string | null
  members: number | null
  events: number | null
  tasks: number | null
}

interface SkillRow {
  id: string
  name: string
  created_at: string
  updated_at: string
  description: string | null
  members: number | null
  events: number | null
  tasks: number | null
}

function mapSkillRow(row: SkillRow): Skill {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    description: row.description,
    members: row.members,
    events: row.events,
    tasks: row.tasks,
  }
}

export async function listSkills(db: D1DatabaseLike, searchTerm?: string): Promise<Skill[]> {
  let query = 'SELECT id, name, created_at, updated_at, description, members, events, tasks FROM skills'
  const params: unknown[] = []

  if (searchTerm) {
    query += ' WHERE name LIKE ?'
    params.push(`%${searchTerm}%`)
  }

  query += ' ORDER BY name ASC'

  const result = await db.prepare(query).bind(...params).all<SkillRow>()

  return result.results.map(mapSkillRow)
}

export async function getSkillById(db: D1DatabaseLike, id: string): Promise<Skill | null> {
  const row = await db
    .prepare('SELECT id, name, created_at, updated_at, description, members, events, tasks FROM skills WHERE id = ?')
    .bind(id)
    .first<SkillRow>()

  return row ? mapSkillRow(row) : null
}

export async function getSkillByName(db: D1DatabaseLike, name: string): Promise<Skill | null> {
  const row = await db
    .prepare('SELECT id, name, created_at, updated_at, description, members, events, tasks FROM skills WHERE name = ?')
    .bind(name)
    .first<SkillRow>()

  return row ? mapSkillRow(row) : null
}

export interface CreateSkillInput {
  id: string
  name: string
  description?: string | null
}

export async function createSkill(db: D1DatabaseLike, input: CreateSkillInput): Promise<Skill> {
  await db
    .prepare('INSERT INTO skills (id, name, description, members, events, tasks) VALUES (?, ?, ?, 0, 0, 0)')
    .bind(input.id, input.name, input.description ?? null)
    .run()

  const skill = await getSkillById(db, input.id)
  if (!skill) {
    throw new Error(`Failed to create skill with id ${input.id}`)
  }

  return skill
}

export interface UpdateSkillInput {
  name?: string
  description?: string | null
}

export async function updateSkillById(db: D1DatabaseLike, id: string, input: UpdateSkillInput): Promise<Skill | null> {
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

  if (updates.length === 0) {
    return getSkillById(db, id)
  }

  updates.push("updated_at = datetime('now')")

  await db
    .prepare(`UPDATE skills SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  return getSkillById(db, id)
}

export async function deleteSkillById(db: D1DatabaseLike, id: string): Promise<boolean> {
  const existing = await getSkillById(db, id)

  if (!existing) {
    return false
  }

  const result = (await db.prepare('DELETE FROM skills WHERE id = ?').bind(id).run()) as {
    meta: { changes?: number }
  }
  return (result.meta.changes ?? 0) > 0
}

export async function getOrCreateSkillByName(db: D1DatabaseLike, name: string): Promise<Skill> {
  const existing = await getSkillByName(db, name)
  if (existing) {
    return existing
  }

  const id = crypto.randomUUID()
  return createSkill(db, {
    id,
    name,
  })
}

export interface SkillAssociation {
  skillId: string
  associatedId: string
  associatedType: 'project' | 'event' | 'task' | 'position' | 'club'
  skillLevel: 'required' | 'recommended' | 'aquired' | null
}

interface SkillAssociationRow {
  skill_id: string
  associated_id: string
  associated_type: string
  skill_level: string | null
}

function mapSkillAssociationRow(row: SkillAssociationRow): SkillAssociation {
  return {
    skillId: row.skill_id,
    associatedId: row.associated_id,
    associatedType: row.associated_type as 'project' | 'event' | 'task' | 'position' | 'club',
    skillLevel: row.skill_level as 'required' | 'recommended' | 'aquired' | null,
  }
}

export async function associateSkill(
  db: D1DatabaseLike,
  skillId: string,
  associatedId: string,
  associatedType: 'project' | 'event' | 'task' | 'position' | 'club',
  skillLevel?: 'required' | 'recommended' | 'aquired'
): Promise<SkillAssociation> {
  await db
    .prepare(`INSERT OR REPLACE INTO skills_association (skill_id, associated_id, associated_type, skill_level)
              VALUES (?, ?, ?, ?)`)
    .bind(skillId, associatedId, associatedType, skillLevel ?? null)
    .run()

  return getSkillAssociation(db, skillId, associatedId)
}

export async function getSkillAssociation(
  db: D1DatabaseLike,
  skillId: string,
  associatedId: string
): Promise<SkillAssociation> {
  const row = await db
    .prepare(`SELECT skill_id, associated_id, associated_type, skill_level
              FROM skills_association
              WHERE skill_id = ? AND associated_id = ?`)
    .bind(skillId, associatedId)
    .first<SkillAssociationRow>()

  if (!row) {
    throw new Error(`Skill association not found`)
  }

  return mapSkillAssociationRow(row)
}

export async function getSkillsByAssociatedId(
  db: D1DatabaseLike,
  associatedId: string,
  associatedType?: 'project' | 'event' | 'task' | 'position' | 'club'
): Promise<(SkillAssociation & { skill: Skill })[]> {
  let query = `SELECT sa.skill_id, sa.associated_id, sa.associated_type, sa.skill_level,
                      s.id, s.name, s.created_at, s.updated_at, s.description, s.members, s.events, s.tasks
               FROM skills_association sa
               JOIN skills s ON sa.skill_id = s.id
               WHERE sa.associated_id = ?`
  const params: unknown[] = [associatedId]

  if (associatedType) {
    query += ` AND sa.associated_type = ?`
    params.push(associatedType)
  }

  const result = await db
    .prepare(query)
    .bind(...params)
    .all<SkillAssociationRow & SkillRow>()

  return result.results.map((row) => ({
    skillId: row.skill_id,
    associatedId: row.associated_id,
    associatedType: row.associated_type as 'project' | 'event' | 'task' | 'position' | 'club',
    skillLevel: row.skill_level as 'required' | 'recommended' | 'aquired' | null,
    skill: mapSkillRow(row),
  }))
}

export async function disassociateSkill(
  db: D1DatabaseLike,
  skillId: string,
  associatedId: string
): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM skills_association WHERE skill_id = ? AND associated_id = ?`)
    .bind(skillId, associatedId)
    .run()

  return (result.meta.changes ?? 0) > 0
}
