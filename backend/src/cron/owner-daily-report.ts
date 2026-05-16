import { sendBackendTelegramNotification } from '../services/telegram-notification.service'
import type { AppBindings, D1DatabaseLike } from '../types/bindings'
import {
  alreadySentOwnerReportToday,
  getLocalDayUtcBounds,
  getYesterdayYmd,
} from '../utils/cron-timezone'
import { filterMembersWithTelegram, getFrontendProjectUrl } from './members'
import type { CronContext, CronRunStats, ProjectReportRow } from './types'

interface ActivitySummary {
  tasksCreated: number
  tasksUpdated: number
  tasksCompleted: number
  eventsCreated: number
  eventsUpdated: number
  registrations: number
  positionsCreated: number
  applications: number
  pointsTotal: number
  pointsCount: number
  projectUpdated: boolean
}

function hasActivity(summary: ActivitySummary): boolean {
  return (
    summary.tasksCreated > 0
    || summary.tasksUpdated > 0
    || summary.tasksCompleted > 0
    || summary.eventsCreated > 0
    || summary.eventsUpdated > 0
    || summary.registrations > 0
    || summary.positionsCreated > 0
    || summary.applications > 0
    || summary.pointsCount > 0
    || summary.projectUpdated
  )
}

function buildReportMessage(
  projectName: string,
  reportDate: string,
  summary: ActivitySummary,
  projectUrl: string | null,
) {
  const lines = [
    `📊 تقرير يومي للمشروع *${projectName.replace(/[*_]/g, '')}*`,
    `📅 ${reportDate}\n`,
  ]

  if (summary.tasksCreated || summary.tasksUpdated || summary.tasksCompleted) {
    lines.push('*المهام:*')
    if (summary.tasksCreated) lines.push(`  • جديدة: ${summary.tasksCreated}`)
    if (summary.tasksUpdated) lines.push(`  • محدّثة: ${summary.tasksUpdated}`)
    if (summary.tasksCompleted) lines.push(`  • مكتملة: ${summary.tasksCompleted}`)
    lines.push('')
  }

  if (summary.eventsCreated || summary.eventsUpdated || summary.registrations) {
    lines.push('*الفعاليات:*')
    if (summary.eventsCreated) lines.push(`  • فعاليات جديدة: ${summary.eventsCreated}`)
    if (summary.eventsUpdated) lines.push(`  • فعاليات محدّثة: ${summary.eventsUpdated}`)
    if (summary.registrations) lines.push(`  • تسجيلات: ${summary.registrations}`)
    lines.push('')
  }

  if (summary.positionsCreated || summary.applications) {
    lines.push('*المناصب:*')
    if (summary.positionsCreated) lines.push(`  • مناصب جديدة: ${summary.positionsCreated}`)
    if (summary.applications) lines.push(`  • طلبات: ${summary.applications}`)
    lines.push('')
  }

  if (summary.pointsCount > 0) {
    lines.push(`*النقاط:* ${summary.pointsTotal} (${summary.pointsCount} معاملة)\n`)
  }

  if (summary.projectUpdated) {
    lines.push('*تم تحديث بيانات المشروع*\n')
  }

  return {
    message: lines.join('\n').trim(),
    boxes: projectUrl ? [{ text: 'فتح المشروع 📁', link: projectUrl }] : undefined,
  }
}

async function countInWindow(
  db: D1DatabaseLike,
  sql: string,
  binds: unknown[],
): Promise<number> {
  const row = await db.prepare(sql).bind(...binds).first<{ count: number }>()
  return row?.count ?? 0
}

async function collectActivity(
  db: D1DatabaseLike,
  projectId: string,
  start: string,
  end: string,
): Promise<ActivitySummary> {
  const [
    tasksCreated,
    tasksUpdated,
    tasksCompleted,
    eventsCreated,
    eventsUpdated,
    registrations,
    positionsCreated,
    applications,
    pointsRow,
    projectUpdated,
  ] = await Promise.all([
    countInWindow(
      db,
      `SELECT COUNT(*) AS count FROM tasks
       WHERE project_id = ? AND created_at >= ? AND created_at < ?`,
      [projectId, start, end],
    ),
    countInWindow(
      db,
      `SELECT COUNT(*) AS count FROM tasks
       WHERE project_id = ? AND updated_at >= ? AND updated_at < ?
         AND NOT (created_at >= ? AND created_at < ?)`,
      [projectId, start, end, start, end],
    ),
    countInWindow(
      db,
      `SELECT COUNT(*) AS count FROM tasks
       WHERE project_id = ? AND completed_at IS NOT NULL
         AND completed_at >= ? AND completed_at < ?`,
      [projectId, start, end],
    ),
    countInWindow(
      db,
      `SELECT COUNT(*) AS count FROM events
       WHERE project_id = ? AND created_at >= ? AND created_at < ?`,
      [projectId, start, end],
    ),
    countInWindow(
      db,
      `SELECT COUNT(*) AS count FROM events
       WHERE project_id = ? AND updated_at >= ? AND updated_at < ?
         AND NOT (created_at >= ? AND created_at < ?)`,
      [projectId, start, end, start, end],
    ),
    countInWindow(
      db,
      `SELECT COUNT(*) AS count FROM event_registrations er
       INNER JOIN events e ON e.id = er.event_id
       WHERE e.project_id = ? AND (
         (er.created_at >= ? AND er.created_at < ?)
         OR (er.updated_at >= ? AND er.updated_at < ?
             AND NOT (er.created_at >= ? AND er.created_at < ?))
       )`,
      [projectId, start, end, start, end, start, end],
    ),
    countInWindow(
      db,
      `SELECT COUNT(*) AS count FROM positions
       WHERE project_id = ? AND created_at >= ? AND created_at < ?`,
      [projectId, start, end],
    ),
    countInWindow(
      db,
      `SELECT COUNT(*) AS count FROM position_applications pa
       INNER JOIN positions p ON p.id = pa.position_id
       WHERE p.project_id = ? AND (
         (pa.created_at >= ? AND pa.created_at < ?)
         OR (pa.updated_at >= ? AND pa.updated_at < ?)
       )`,
      [projectId, start, end, start, end],
    ),
    db
      .prepare(
        `SELECT COALESCE(SUM(pt.amount), 0) AS total, COUNT(*) AS count
         FROM points_transactions pt
         INNER JOIN tasks t ON t.id = pt.task_id
         WHERE t.project_id = ? AND pt.created_at >= ? AND pt.created_at < ?`,
      )
      .bind(projectId, start, end)
      .first<{ total: number; count: number }>(),
    countInWindow(
      db,
      `SELECT COUNT(*) AS count FROM projects
       WHERE id = ? AND updated_at >= ? AND updated_at < ?
         AND NOT (created_at >= ? AND created_at < ?)`,
      [projectId, start, end, start, end],
    ),
  ])

  return {
    tasksCreated,
    tasksUpdated,
    tasksCompleted,
    eventsCreated,
    eventsUpdated,
    registrations,
    positionsCreated,
    applications,
    pointsTotal: pointsRow?.total ?? 0,
    pointsCount: pointsRow?.count ?? 0,
    projectUpdated: projectUpdated > 0,
  }
}

async function fetchActiveProjects(bindings: AppBindings): Promise<ProjectReportRow[]> {
  const result = await bindings.VMS_DB.prepare(
    `SELECT id, name, owner, last_reported_at
     FROM projects
     WHERE status = 'active'`,
  )
    .bind()
    .all<ProjectReportRow>()

  return result.results
}

export async function runOwnerDailyReports(
  bindings: AppBindings,
  ctx: CronContext,
  stats: CronRunStats,
): Promise<void> {
  const reportDate = getYesterdayYmd(ctx.now, ctx.timeZone)
  const { start, end } = getLocalDayUtcBounds(reportDate, ctx.timeZone)
  const projects = await fetchActiveProjects(bindings)
  const ownersWithTelegram = await filterMembersWithTelegram(
    bindings.MEMBERS_DB,
    projects.map((p) => p.owner),
  )

  const sentAt = ctx.now.toISOString()

  for (const project of projects) {
    if (alreadySentOwnerReportToday(project.last_reported_at, ctx.now, ctx.timeZone)) {
      stats.ownerReports.skipped++
      continue
    }

    if (!ownersWithTelegram.has(project.owner)) {
      stats.ownerReports.skipped++
      continue
    }

    const summary = await collectActivity(bindings.VMS_DB, project.id, start, end)

    if (!hasActivity(summary)) {
      stats.ownerReports.skipped++
      continue
    }

    stats.ownerReports.eligible++

    const projectUrl = getFrontendProjectUrl(bindings, project.id)
    const { message, boxes } = buildReportMessage(project.name, reportDate, summary, projectUrl)

    if (ctx.dryRun) {
      console.log('[cron:dry-run] owner report', { projectId: project.id, owner: project.owner })
      stats.ownerReports.sent++
      continue
    }

    const result = await sendBackendTelegramNotification(bindings, {
      target: project.owner,
      message,
      ...(boxes ? { boxes } : {}),
    })

    if (!result.success) {
      console.warn('[cron] owner report failed', { projectId: project.id, result })
      stats.ownerReports.skipped++
      continue
    }

    await bindings.VMS_DB.prepare('UPDATE projects SET last_reported_at = ? WHERE id = ?')
      .bind(sentAt, project.id)
      .run()

    stats.ownerReports.sent++
  }
}
