import type { CreateProjectNoteInput, UpdateProjectNoteInput } from '../schemas/vms-project-note.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface ProjectNoteRow {
  id: string
  created_at: string
  updated_at: string
  project_id: string
  title: string
  content: string
  content_preview: string | null
  created_by: string
}

export interface ProjectNoteRecord {
  id: string
  createdAt: string
  updatedAt: string
  projectId: string
  title: string
  content: string
  contentPreview: string | null
  createdBy: string
}

function mapProjectNoteRow(row: ProjectNoteRow): ProjectNoteRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    projectId: row.project_id,
    title: row.title,
    content: row.content,
    contentPreview: row.content_preview,
    createdBy: row.created_by,
  }
}

export async function listProjectNotes(db: D1DatabaseLike, projectId?: string) {
  if (projectId) {
    const result = await db
      .prepare(
        `SELECT id, created_at, updated_at, project_id, title, content, content_preview, created_by
         FROM project_notes
         WHERE project_id = ?
         ORDER BY updated_at DESC`,
      )
      .bind(projectId)
      .all<ProjectNoteRow>()

    return (result.results ?? []).map(mapProjectNoteRow)
  }

  const result = await db
    .prepare(
      `SELECT id, created_at, updated_at, project_id, title, content, content_preview, created_by
       FROM project_notes
       ORDER BY updated_at DESC`,
    )
    .bind()
    .all<ProjectNoteRow>()

  return (result.results ?? []).map(mapProjectNoteRow)
}

export async function getProjectNoteById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare(
      `SELECT id, created_at, updated_at, project_id, title, content, content_preview, created_by
       FROM project_notes
       WHERE id = ?`,
    )
    .bind(id)
    .first<ProjectNoteRow>()

  return row ? mapProjectNoteRow(row) : null
}

export async function createProjectNote(
  db: D1DatabaseLike,
  id: string,
  createdBy: string,
  input: CreateProjectNoteInput,
) {
  await db
    .prepare(
      `INSERT INTO project_notes (id, project_id, title, content, content_preview, created_by)
       VALUES (?, ?, ?, '', NULL, ?)`,
    )
    .bind(id, input.projectId, input.title, createdBy)
    .run()

  const note = await getProjectNoteById(db, id)
  if (!note) {
    throw new Error('Failed to create project note.')
  }

  return note
}

export async function updateProjectNoteById(db: D1DatabaseLike, id: string, input: UpdateProjectNoteInput) {
  const fields: string[] = []
  const values: unknown[] = []

  if (input.title !== undefined) {
    fields.push('title = ?')
    values.push(input.title)
  }

  if (fields.length === 0) {
    const note = await getProjectNoteById(db, id)
    if (!note) {
      return null
    }

    return note
  }

  values.push(id)

  await db
    .prepare(`UPDATE project_notes SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return getProjectNoteById(db, id)
}

export async function updateProjectNoteContent(
  db: D1DatabaseLike,
  id: string,
  content: string,
  contentPreview: string | null,
) {
  await db
    .prepare(`UPDATE project_notes SET content = ?, content_preview = ? WHERE id = ?`)
    .bind(content, contentPreview, id)
    .run()
}

export async function deleteProjectNoteById(db: D1DatabaseLike, id: string) {
  await db.prepare(`DELETE FROM project_notes WHERE id = ?`).bind(id).run()
}
