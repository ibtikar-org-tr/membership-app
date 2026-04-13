import type { D1DatabaseLike } from '../types/bindings'
import type { CreateProjectInput, UpdateProjectInput } from '../schemas/vms-project.schema'

interface ProjectRow {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  parent_project_id: string | null
  owner: string
  telegram_group_id: string | null
  status: string
}

function mapProjectRow(row: ProjectRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    description: row.description,
    parentProjectId: row.parent_project_id,
    owner: row.owner,
    telegramGroupId: row.telegram_group_id,
    status: row.status,
  }
}

export async function listProjects(db: D1DatabaseLike) {
  const result = await db
    .prepare('SELECT id, created_at, updated_at, name, description, parent_project_id, owner, telegram_group_id, status FROM projects ORDER BY created_at DESC')
    .bind()
    .all<ProjectRow>()

  return result.results.map(mapProjectRow)
}

export async function listProjectsForMember(db: D1DatabaseLike, membershipNumber: string) {
  const normalizedMembershipNumber = membershipNumber.trim()

  const result = await db
    .prepare(
      `SELECT id, created_at, updated_at, name, description, parent_project_id, owner, telegram_group_id, status
       FROM projects
       WHERE owner = ?
          OR EXISTS (
            SELECT 1
            FROM project_members pm
            WHERE pm.project_id = projects.id
              AND pm.membership_number = ?
          )
       ORDER BY created_at DESC`,
    )
    .bind(normalizedMembershipNumber, normalizedMembershipNumber)
    .all<ProjectRow>()

  return result.results.map(mapProjectRow)
}

export async function getProjectById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare('SELECT id, created_at, updated_at, name, description, parent_project_id, owner, telegram_group_id, status FROM projects WHERE id = ?')
    .bind(id)
    .first<ProjectRow>()

  return row ? mapProjectRow(row) : null
}

export async function getProjectByIdForMember(db: D1DatabaseLike, id: string, membershipNumber: string) {
  const normalizedMembershipNumber = membershipNumber.trim()

  const row = await db
    .prepare(
      `SELECT id, created_at, updated_at, name, description, parent_project_id, owner, telegram_group_id, status
       FROM projects
       WHERE id = ?
         AND (
           owner = ?
           OR EXISTS (
             SELECT 1
             FROM project_members pm
             WHERE pm.project_id = projects.id
               AND pm.membership_number = ?
           )
         )`,
    )
    .bind(id, normalizedMembershipNumber, normalizedMembershipNumber)
    .first<ProjectRow>()

  return row ? mapProjectRow(row) : null
}

export async function createProject(db: D1DatabaseLike, id: string, input: CreateProjectInput) {
  await db
    .prepare(
      'INSERT INTO projects (id, name, description, parent_project_id, owner, telegram_group_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      input.name,
      input.description ?? null,
      input.parentProjectId ?? null,
      input.owner,
      input.telegramGroupId ?? null,
      input.status,
    )
    .run()

  return getProjectById(db, id)
}

export async function updateProjectById(db: D1DatabaseLike, id: string, input: UpdateProjectInput) {
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

  if (input.parentProjectId !== undefined) {
    updates.push('parent_project_id = ?')
    values.push(input.parentProjectId)
  }

  if (input.owner !== undefined) {
    updates.push('owner = ?')
    values.push(input.owner)
  }

  if (input.telegramGroupId !== undefined) {
    updates.push('telegram_group_id = ?')
    values.push(input.telegramGroupId)
  }

  if (input.status !== undefined) {
    updates.push('status = ?')
    values.push(input.status)
  }

  if (updates.length === 0) {
    return getProjectById(db, id)
  }

  updates.push("updated_at = datetime('now')")

  await db
    .prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  return getProjectById(db, id)
}

export async function deleteProjectById(db: D1DatabaseLike, id: string) {
  const existing = await getProjectById(db, id)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
  return true
}
