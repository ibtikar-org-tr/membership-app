import { sendBackendTelegramNotification } from '../services/telegram-notification.service'
import type { AppBindings } from '../types/bindings'
import { isTaskReminderDue } from '../utils/cron-timezone'
import { filterMembersWithTelegram, getFrontendProjectUrl } from './members'
import type { CronContext, CronRunStats, TaskReminderRow } from './types'

function sanitizeBold(value: string) {
  return value.replace(/[*_]/g, '').trim()
}

function formatDueDateYmd(value: string) {
  return value.slice(0, 10)
}

function taskSortKey(task: TaskReminderRow, now: Date, timeZone: string) {
  const due = task.due_date?.slice(0, 10) ?? '9999-12-31'
  const overdue = task.due_date && due < new Intl.DateTimeFormat('en-CA', { timeZone }).format(now)
  const priorityRank = task.priority === 'high' ? 0 : task.priority === 'medium' ? 1 : 2
  return { overdue: overdue ? 0 : 1, due, priorityRank }
}

function buildTaskDigestMessage(tasks: TaskReminderRow[]) {
  const lines = [`📋 لديك *${tasks.length}* مهمة مفتوحة تحتاج متابعة:\n`]

  for (const task of tasks) {
    const name = sanitizeBold(task.name)
    const project = sanitizeBold(task.project_name)
    let line = `• *${name}*\n  📁 ${project}`

    if (task.due_date) {
      line += `\n  ⏳ ${formatDueDateYmd(task.due_date)}`
    }

    if (task.priority === 'high') {
      line += '\n  ‼️ أولوية عالية'
    }

    lines.push(line)
  }

  return lines.join('\n\n')
}

async function fetchOpenTasks(bindings: AppBindings): Promise<TaskReminderRow[]> {
  const result = await bindings.VMS_DB.prepare(
    `SELECT
      t.id,
      t.name,
      t.project_id,
      p.name AS project_name,
      t.assigned_to,
      t.due_date,
      t.priority,
      t.last_reminded_at
    FROM tasks t
    INNER JOIN projects p ON p.id = t.project_id
    WHERE p.status = 'active'
      AND t.status IN ('open', 'in_progress')
      AND t.assigned_to IS NOT NULL
      AND trim(t.assigned_to) != ''`,
  )
    .bind()
    .all<TaskReminderRow>()

  return result.results
}

export async function runTaskReminders(
  bindings: AppBindings,
  ctx: CronContext,
  stats: CronRunStats,
): Promise<void> {
  const rows = await fetchOpenTasks(bindings)
  const eligibleByMember = new Map<string, TaskReminderRow[]>()

  for (const row of rows) {
    if (!isTaskReminderDue(row.last_reminded_at, row.due_date, ctx.now, ctx.timeZone)) {
      stats.taskReminders.skipped++
      continue
    }

    stats.taskReminders.eligible++
    const list = eligibleByMember.get(row.assigned_to) ?? []
    list.push(row)
    eligibleByMember.set(row.assigned_to, list)
  }

  if (eligibleByMember.size === 0) {
    return
  }

  const withTelegram = await filterMembersWithTelegram(
    bindings.MEMBERS_DB,
    [...eligibleByMember.keys()],
  )

  const sentAt = ctx.now.toISOString()

  for (const [membershipNumber, tasks] of eligibleByMember) {
    if (!withTelegram.has(membershipNumber)) {
      stats.taskReminders.skipped += tasks.length
      continue
    }

    tasks.sort((a, b) => {
      const ka = taskSortKey(a, ctx.now, ctx.timeZone)
      const kb = taskSortKey(b, ctx.now, ctx.timeZone)
      if (ka.overdue !== kb.overdue) return ka.overdue - kb.overdue
      if (ka.due !== kb.due) return ka.due.localeCompare(kb.due)
      return ka.priorityRank - kb.priorityRank
    })

    const message = buildTaskDigestMessage(tasks)
    const projectId = tasks[0]?.project_id
    const projectUrl = projectId ? getFrontendProjectUrl(bindings, projectId) : null

    if (ctx.dryRun) {
      console.log('[cron:dry-run] task reminder', { membershipNumber, taskCount: tasks.length })
      stats.taskReminders.sent++
      continue
    }

    const result = await sendBackendTelegramNotification(bindings, {
      target: membershipNumber,
      message,
      ...(projectUrl
        ? { boxes: [{ text: 'فتح المشروع 📁', link: projectUrl }] }
        : {}),
    })

    if (!result.success) {
      console.warn('[cron] task reminder failed', { membershipNumber, result })
      stats.taskReminders.skipped += tasks.length
      continue
    }

    for (const task of tasks) {
      await bindings.VMS_DB.prepare('UPDATE tasks SET last_reminded_at = ? WHERE id = ?')
        .bind(sentAt, task.id)
        .run()
    }

    stats.taskReminders.sent++
  }
}
