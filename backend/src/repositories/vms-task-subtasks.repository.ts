import type { CreateTaskSubtaskInput, UpdateTaskSubtaskInput } from '../schemas/vms-task-subtask.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface TaskSubtaskRow {
  id: string
  created_at: string
  updated_at: string
  parent_task_id: string
  name: string
  status: string
  completed_at: string | null
  completed_by: string | null
  sort_order: number
}

export interface TaskSubtaskRecord {
  id: string
  createdAt: string
  updatedAt: string
  parentTaskId: string
  name: string
  status: 'open' | 'completed'
  completedAt: string | null
  completedBy: string | null
  sortOrder: number
}

export interface SubtaskProgress {
  completed: number
  total: number
}

function mapSubtaskRow(row: TaskSubtaskRow): TaskSubtaskRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentTaskId: row.parent_task_id,
    name: row.name,
    status: row.status === 'completed' ? 'completed' : 'open',
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    sortOrder: row.sort_order,
  }
}

const SUBTASK_COLUMNS =
  'id, created_at, updated_at, parent_task_id, name, status, completed_at, completed_by, sort_order'

export async function listSubtasksByTaskId(db: D1DatabaseLike, parentTaskId: string) {
  const result = await db
    .prepare(
      `SELECT ${SUBTASK_COLUMNS}
       FROM task_subtasks
       WHERE parent_task_id = ?
       ORDER BY sort_order ASC, created_at ASC`,
    )
    .bind(parentTaskId)
    .all<TaskSubtaskRow>()

  return (result.results ?? []).map(mapSubtaskRow)
}

export async function getSubtaskById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare(`SELECT ${SUBTASK_COLUMNS} FROM task_subtasks WHERE id = ?`)
    .bind(id)
    .first<TaskSubtaskRow>()

  return row ? mapSubtaskRow(row) : null
}

async function getNextSortOrder(db: D1DatabaseLike, parentTaskId: string) {
  const row = await db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM task_subtasks WHERE parent_task_id = ?')
    .bind(parentTaskId)
    .first<{ next_order: number }>()

  return row?.next_order ?? 0
}

export async function createSubtask(db: D1DatabaseLike, id: string, parentTaskId: string, input: CreateTaskSubtaskInput) {
  const sortOrder = await getNextSortOrder(db, parentTaskId)

  await db
    .prepare(
      `INSERT INTO task_subtasks (id, parent_task_id, name, status, sort_order)
       VALUES (?, ?, ?, 'open', ?)`,
    )
    .bind(id, parentTaskId, input.name, sortOrder)
    .run()

  const subtask = await getSubtaskById(db, id)
  if (!subtask) {
    throw new Error('Failed to create task subtask.')
  }

  return subtask
}

export async function updateSubtaskById(
  db: D1DatabaseLike,
  id: string,
  input: UpdateTaskSubtaskInput,
  actorMembershipNumber?: string,
) {
  const fields: string[] = []
  const values: unknown[] = []

  if (input.name !== undefined) {
    fields.push('name = ?')
    values.push(input.name)
  }

  if (input.status !== undefined) {
    fields.push('status = ?')
    values.push(input.status)

    if (input.status === 'completed') {
      fields.push('completed_at = ?')
      values.push(new Date().toISOString())
      fields.push('completed_by = ?')
      values.push(actorMembershipNumber ?? null)
    } else {
      fields.push('completed_at = ?')
      values.push(null)
      fields.push('completed_by = ?')
      values.push(null)
    }
  }

  if (fields.length === 0) {
    return getSubtaskById(db, id)
  }

  values.push(id)

  await db
    .prepare(`UPDATE task_subtasks SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return getSubtaskById(db, id)
}

export async function deleteSubtaskById(db: D1DatabaseLike, id: string) {
  const existing = await getSubtaskById(db, id)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM task_subtasks WHERE id = ?').bind(id).run()
  return true
}

export async function getSubtaskProgressByTaskIds(db: D1DatabaseLike, taskIds: string[]) {
  const progressMap = new Map<string, SubtaskProgress>()

  if (taskIds.length === 0) {
    return progressMap
  }

  const placeholders = taskIds.map(() => '?').join(', ')
  const result = await db
    .prepare(
      `SELECT parent_task_id,
              COUNT(*) AS total,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
       FROM task_subtasks
       WHERE parent_task_id IN (${placeholders})
       GROUP BY parent_task_id`,
    )
    .bind(...taskIds)
    .all<{ parent_task_id: string; total: number; completed: number }>()

  for (const row of result.results ?? []) {
    progressMap.set(row.parent_task_id, {
      completed: row.completed,
      total: row.total,
    })
  }

  return progressMap
}

export function attachSubtaskProgress<T extends { id: string }>(
  tasks: T[],
  progressMap: Map<string, SubtaskProgress>,
): Array<T & { subtaskProgress: SubtaskProgress | null }> {
  return tasks.map((task) => ({
    ...task,
    subtaskProgress: progressMap.get(task.id) ?? null,
  }))
}
