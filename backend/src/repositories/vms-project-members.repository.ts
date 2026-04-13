import type { CreateProjectMemberInput, UpdateProjectMemberInput } from '../schemas/vms-project-member.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface ProjectMemberRow {
  project_id: string
  membership_number: string
  role: string
  display_name: string | null
}

function mapProjectMemberRow(row: ProjectMemberRow) {
  return {
    projectId: row.project_id,
    membershipNumber: row.membership_number,
    role: row.role,
    displayName: row.display_name ?? row.membership_number,
  }
}

export async function listProjectMembers(db: D1DatabaseLike, projectId?: string) {
  const query = projectId
    ? `SELECT
        pm.project_id,
        pm.membership_number,
        pm.role,
        COALESCE(NULLIF(TRIM(ui.en_name), ''), NULLIF(TRIM(ui.ar_name), ''), u.email, pm.membership_number) AS display_name
      FROM project_members pm
      LEFT JOIN users u ON u.membership_number = pm.membership_number
      LEFT JOIN user_info ui ON ui.membership_number = pm.membership_number
      WHERE pm.project_id = ?
      ORDER BY pm.membership_number ASC`
    : `SELECT
        pm.project_id,
        pm.membership_number,
        pm.role,
        COALESCE(NULLIF(TRIM(ui.en_name), ''), NULLIF(TRIM(ui.ar_name), ''), u.email, pm.membership_number) AS display_name
      FROM project_members pm
      LEFT JOIN users u ON u.membership_number = pm.membership_number
      LEFT JOIN user_info ui ON ui.membership_number = pm.membership_number
      ORDER BY pm.project_id ASC, pm.membership_number ASC`

  const statement = db.prepare(query)
  const result = projectId ? await statement.bind(projectId).all<ProjectMemberRow>() : await statement.bind().all<ProjectMemberRow>()

  return result.results.map(mapProjectMemberRow)
}

export async function getProjectMember(db: D1DatabaseLike, projectId: string, membershipNumber: string) {
  const row = await db
    .prepare(
      `SELECT
        pm.project_id,
        pm.membership_number,
        pm.role,
        COALESCE(NULLIF(TRIM(ui.en_name), ''), NULLIF(TRIM(ui.ar_name), ''), u.email, pm.membership_number) AS display_name
      FROM project_members pm
      LEFT JOIN users u ON u.membership_number = pm.membership_number
      LEFT JOIN user_info ui ON ui.membership_number = pm.membership_number
      WHERE pm.project_id = ? AND pm.membership_number = ?`
    )
    .bind(projectId, membershipNumber)
    .first<ProjectMemberRow>()

  return row ? mapProjectMemberRow(row) : null
}

export async function createProjectMember(db: D1DatabaseLike, input: CreateProjectMemberInput) {
  await db
    .prepare('INSERT INTO project_members (project_id, membership_number, role) VALUES (?, ?, ?)')
    .bind(input.projectId, input.membershipNumber, input.role)
    .run()

  return getProjectMember(db, input.projectId, input.membershipNumber)
}

export async function updateProjectMember(
  db: D1DatabaseLike,
  projectId: string,
  membershipNumber: string,
  input: UpdateProjectMemberInput,
) {
  const updates: string[] = []
  const values: unknown[] = []

  if (input.projectId !== undefined) {
    updates.push('project_id = ?')
    values.push(input.projectId)
  }

  if (input.membershipNumber !== undefined) {
    updates.push('membership_number = ?')
    values.push(input.membershipNumber)
  }

  if (input.role !== undefined) {
    updates.push('role = ?')
    values.push(input.role)
  }

  if (updates.length === 0) {
    return getProjectMember(db, projectId, membershipNumber)
  }

  await db
    .prepare(`UPDATE project_members SET ${updates.join(', ')} WHERE project_id = ? AND membership_number = ?`)
    .bind(...values, projectId, membershipNumber)
    .run()

  const nextProjectId = input.projectId ?? projectId
  const nextMembershipNumber = input.membershipNumber ?? membershipNumber
  return getProjectMember(db, nextProjectId, nextMembershipNumber)
}

export async function deleteProjectMember(db: D1DatabaseLike, projectId: string, membershipNumber: string) {
  const existing = await getProjectMember(db, projectId, membershipNumber)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM project_members WHERE project_id = ? AND membership_number = ?').bind(projectId, membershipNumber).run()
  return true
}
