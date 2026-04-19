import { sendBackendTelegramNotification } from './telegram-notification.service'
import type { AppBindings } from '../types/bindings'

interface TaskAssignmentNotificationOptions {
  assignedTo: string
  projectId: string
  projectName: string
  taskName: string
  dueDate?: string | null
  description?: string | null
  priority?: string | null
  points?: number | null
}

function formatDueDateYmd(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10)
  }

  return parsed.toISOString().slice(0, 10)
}

function sanitizeBoldValue(value: string) {
  return value.replace(/[*_]/g, '').trim()
}

function buildTaskAssignmentMessage(options: TaskAssignmentNotificationOptions) {
  const taskName = sanitizeBoldValue(options.taskName)
  const projectName = sanitizeBoldValue(options.projectName)

  let message = `تم تعيينك إلى مهمة جديدة: *${taskName}*`

  message += `\n\nالمشروع: *${projectName}*`

  if (options.dueDate) {
    message += `\n\nتاريخ الاستحقاق: *${formatDueDateYmd(options.dueDate)}*`
  }

  const description = options.description?.trim()
  if (description) {
    message += `\n\nوصف المهمة:\n${description}`
  }

  if (options.priority?.trim() === 'high') {
    message += `\n\nالأولوية: *عالية*`
  }

  if (typeof options.points === 'number' && Number.isFinite(options.points) && options.points > 1) {
    message += `\n\nالنقاط: *${Math.trunc(options.points)}*`
  }

  return message
}

export async function notifyAssignedTask(env: AppBindings, options: TaskAssignmentNotificationOptions) {
  if (!options.assignedTo?.trim()) {
    return
  }

  const message = buildTaskAssignmentMessage(options)
  const frontendBaseUrl = env.FRONTEND_BASE_URL?.trim().replace(/\/+$/, '')
  const projectUrl = frontendBaseUrl
    ? `${frontendBaseUrl}/dashboard/projects/${encodeURIComponent(options.projectId)}`
    : null

  const result = await sendBackendTelegramNotification(env, {
    target: options.assignedTo.trim(),
    message,
    ...(projectUrl
      ? {
          boxes: [
            {
              text: 'فتح المشروع',
              link: projectUrl,
            },
          ],
        }
      : {}),
  })

  if (!result.success) {
    console.warn('Telegram assignment notification failed:', result)
  }
}