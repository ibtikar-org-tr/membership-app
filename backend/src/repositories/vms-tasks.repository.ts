import type { CreateTaskInput, UpdateTaskInput } from '../schemas/vms-task.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface TaskRow {
  id: string
  created_at: string
  updated_at: string
  project_id: string
  name: string
  description: string | null
  created_by: string
  status: string
  priority: string | null
  due_date: string | null
  points: number
  assigned_to: string | null
  completed_by: string | null
  completed_at: string | null
  approved_by: string | null
  skills: string | null
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

function mapTaskRow(row: TaskRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    status: row.status,
    priority: row.priority ?? 'medium',
    dueDate: row.due_date,
    points: row.points,
    assignedTo: row.assigned_to,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    approvedBy: row.approved_by,
    skills: parseSkills(row.skills),
  }
}

export async function listTasks(db: D1DatabaseLike) {
  const result = await db
    .prepare(
      'SELECT id, created_at, updated_at, project_id, name, description, created_by, status, priority, due_date, points, assigned_to, completed_by, completed_at, approved_by, skills FROM tasks ORDER BY created_at DESC',
    )
    .bind()
    .all<TaskRow>()

  return result.results.map(mapTaskRow)
}

export async function getTaskById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare(
      'SELECT id, created_at, updated_at, project_id, name, description, created_by, status, priority, due_date, points, assigned_to, completed_by, completed_at, approved_by, skills FROM tasks WHERE id = ?',
    )
    .bind(id)
    .first<TaskRow>()

  return row ? mapTaskRow(row) : null
}

export async function createTask(db: D1DatabaseLike, id: string, input: CreateTaskInput) {
  await db
    .prepare(
      'INSERT INTO tasks (id, project_id, name, description, created_by, status, priority, due_date, points, assigned_to, completed_by, completed_at, approved_by, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      input.projectId,
      input.name,
      input.description ?? null,
      input.createdBy,
      input.status,
      input.priority,
      input.dueDate ?? null,
      input.points ?? 1,
      input.assignedTo ?? null,
      input.completedBy ?? null,
      input.completedAt ?? null,
      input.approvedBy ?? null,
      input.skills ? JSON.stringify(input.skills) : null,
    )
    .run()

  return getTaskById(db, id)
}

export async function updateTaskById(db: D1DatabaseLike, id: string, input: UpdateTaskInput) {
  const updates: string[] = []
  const values: unknown[] = []

  if (input.projectId !== undefined) {
    updates.push('project_id = ?')
    values.push(input.projectId)
  }

  if (input.name !== undefined) {
    updates.push('name = ?')
    values.push(input.name)
  }

  if (input.description !== undefined) {
    updates.push('description = ?')
    values.push(input.description)
  }

  if (input.createdBy !== undefined) {
    updates.push('created_by = ?')
    values.push(input.createdBy)
  }

  if (input.status !== undefined) {
    updates.push('status = ?')
    values.push(input.status)
  }

  if (input.priority !== undefined) {
    updates.push('priority = ?')
    values.push(input.priority)
  }

  if (input.dueDate !== undefined) {
    updates.push('due_date = ?')
    values.push(input.dueDate)
  }

  if (input.points !== undefined) {
    updates.push('points = ?')
    values.push(input.points)
  }

  if (input.assignedTo !== undefined) {
    updates.push('assigned_to = ?')
    values.push(input.assignedTo)
  }

  if (input.completedBy !== undefined) {
    updates.push('completed_by = ?')
    values.push(input.completedBy)
  }

  if (input.completedAt !== undefined) {
    updates.push('completed_at = ?')
    values.push(input.completedAt)
  }

  if (input.approvedBy !== undefined) {
    updates.push('approved_by = ?')
    values.push(input.approvedBy)
  }

  if (input.skills !== undefined) {
    updates.push('skills = ?')
    values.push(input.skills ? JSON.stringify(input.skills) : null)
  }

  if (updates.length === 0) {
    return getTaskById(db, id)
  }

  updates.push("updated_at = datetime('now')")

  await db
    .prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  return getTaskById(db, id)
}

export async function deleteTaskById(db: D1DatabaseLike, id: string) {
  const existing = await getTaskById(db, id)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run()
  return true
}
