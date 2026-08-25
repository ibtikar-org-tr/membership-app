import type { D1DatabaseLike } from '../types/bindings'

interface AgendaTaskRow {
  id: string
  name: string
  status: string
  priority: string | null
  due_date: string | null
  project_id: string
  project_name: string | null
}

interface AgendaEventRow {
  id: string
  name: string
  start_time: string | null
  end_time: string | null
  project_id: string | null
  project_name: string | null
}

export interface AgendaTaskItem {
  id: string
  name: string
  status: string
  priority: string
  dueDate: string | null
  projectId: string
  projectName: string | null
}

export interface AgendaEventItem {
  id: string
  name: string
  startTime: string | null
  endTime: string | null
  projectId: string | null
  projectName: string | null
}

function mapTaskRow(row: AgendaTaskRow): AgendaTaskItem {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    priority: row.priority ?? 'medium',
    dueDate: row.due_date,
    projectId: row.project_id,
    projectName: row.project_name,
  }
}

function mapEventRow(row: AgendaEventRow): AgendaEventItem {
  return {
    id: row.id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    projectId: row.project_id,
    projectName: row.project_name,
  }
}

/**
 * Lean agenda queries: only the caller's active items that fall inside [from, to).
 * No skills hydration / subtask progress — keeps D1 row reads low.
 */
export async function listAgendaTasksInRange(
  db: D1DatabaseLike,
  membershipNumber: string,
  from: string,
  to: string,
) {
  const result = await db
    .prepare(
      `SELECT
         t.id,
         t.name,
         t.status,
         t.priority,
         t.due_date,
         t.project_id,
         p.name AS project_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.assigned_to = ?
         AND t.status IN ('open', 'in_progress')
         AND t.due_date IS NOT NULL
         AND t.due_date >= ?
         AND t.due_date < ?
       ORDER BY t.due_date ASC`,
    )
    .bind(membershipNumber, from, to)
    .all<AgendaTaskRow>()

  return result.results.map(mapTaskRow)
}

export async function listUnscheduledAgendaTasks(db: D1DatabaseLike, membershipNumber: string) {
  const result = await db
    .prepare(
      `SELECT
         t.id,
         t.name,
         t.status,
         t.priority,
         t.due_date,
         t.project_id,
         p.name AS project_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.assigned_to = ?
         AND t.status IN ('open', 'in_progress')
         AND t.due_date IS NULL
       ORDER BY t.updated_at DESC`,
    )
    .bind(membershipNumber)
    .all<AgendaTaskRow>()

  return result.results.map(mapTaskRow)
}

export async function listAgendaEventsInRange(
  db: D1DatabaseLike,
  membershipNumber: string,
  from: string,
  to: string,
) {
  const result = await db
    .prepare(
      `SELECT
         e.id,
         e.name,
         e.start_time,
         e.end_time,
         e.project_id,
         p.name AS project_name
       FROM event_registrations er
       INNER JOIN events e ON e.id = er.event_id
       LEFT JOIN projects p ON p.id = e.project_id
       WHERE er.membership_number = ?
         AND er.status = 'registered'
         AND e.start_time IS NOT NULL
         AND e.start_time < ?
         AND COALESCE(e.end_time, e.start_time) >= ?
       ORDER BY e.start_time ASC`,
    )
    .bind(membershipNumber, to, from)
    .all<AgendaEventRow>()

  return result.results.map(mapEventRow)
}
