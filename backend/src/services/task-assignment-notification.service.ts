import { buildMemberTelegramDmLink, type TelegramMemberContact } from '../utils/telegram-links'
import { sendBackendTelegramNotification } from './telegram-notification.service'
import type { AppBindings } from '../types/bindings'

interface TaskAssignmentNotificationOptions {
  assignedTo: string
  projectId: string
  projectName: string
  taskName: string
  projectOwnerTelegramId?: string | null
  projectOwnerTelegramUsername?: string | null
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

function buildProjectOwnerContact(options: TaskAssignmentNotificationOptions): TelegramMemberContact {
  return {
    telegramId: options.projectOwnerTelegramId,
    telegramUsername: options.projectOwnerTelegramUsername,
  }
}

function buildTaskAssignmentMessage(options: TaskAssignmentNotificationOptions) {
  const taskName = sanitizeBoldValue(options.taskName)
  const projectName = sanitizeBoldValue(options.projectName)

  let message = `🆕 مهمة جديدة:\n*${taskName}*`

  message += `\n\n📁 المشروع: *${projectName}*`

  if (options.dueDate) {
    message += `\n\n⏳ تاريخ الاستحقاق: *${formatDueDateYmd(options.dueDate)}*`
  }

  if (options.priority?.trim() === 'high') {
    message += `\n\n‼️ الأولوية: *عالية*`
  }
  
  if (typeof options.points === 'number' && Number.isFinite(options.points) && options.points > 1) {
    message += `\n\n⭐ النقاط: *${Math.trunc(options.points)}*`
  }
  
  const description = options.description?.trim()
  if (description) {
    message += `\n\n📝 وصف المهمة:\n${description}`
  }

  return message
}

export async function notifyTaskReminder(env: AppBindings, options: TaskAssignmentNotificationOptions) {
  const assignee = options.assignedTo?.trim()
  if (!assignee) {
    return { success: false as const, error: 'Task has no assignee.' }
  }

  const taskName = sanitizeBoldValue(options.taskName)
  const projectName = sanitizeBoldValue(options.projectName)

  let message = `🔔 تذكير بمهمة:\n*${taskName}*`
  message += `\n\n📁 المشروع: *${projectName}*`

  if (options.dueDate) {
    message += `\n\n⏳ تاريخ الاستحقاق: *${formatDueDateYmd(options.dueDate)}*`
  }

  if (options.priority?.trim() === 'high') {
    message += `\n\n‼️ الأولوية: *عالية*`
  }

  if (typeof options.points === 'number' && Number.isFinite(options.points) && options.points > 1) {
    message += `\n\n⭐ النقاط: *${Math.trunc(options.points)}*`
  }

  const description = options.description?.trim()
  if (description) {
    message += `\n\n📝 وصف المهمة:\n${description}`
  }

  const frontendBaseUrl = env.FRONTEND_BASE_URL?.trim().replace(/\/+$/, '')
  const projectUrl = frontendBaseUrl
    ? `${frontendBaseUrl}/dashboard/projects/${encodeURIComponent(options.projectId)}`
    : null
  const ownerDmLink = buildMemberTelegramDmLink(buildProjectOwnerContact(options))

  const result = await sendBackendTelegramNotification(env, {
    target: assignee,
    message,
    ...(() => {
      const boxes: Array<{ text: string; link: string }> = []

      if (projectUrl) {
        boxes.push({
          text: 'فتح المشروع 📁',
          link: projectUrl,
        })
      }

      if (ownerDmLink) {
        boxes.push({
          text: 'تواصل مع مسؤول المشروع 👤',
          link: ownerDmLink,
        })
      }

      return boxes.length > 0 ? { boxes } : {}
    })(),
  })

  if (!result.success) {
    console.warn('Telegram task reminder notification failed:', result)
  }

  return result
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
  const ownerDmLink = buildMemberTelegramDmLink(buildProjectOwnerContact(options))

  const result = await sendBackendTelegramNotification(env, {
    target: options.assignedTo.trim(),
    message,
    ...(() => {
      const boxes: Array<{ text: string; link: string }> = []

      if (projectUrl) {
        boxes.push({
          text: 'فتح المشروع 📁',
          link: projectUrl,
        })
      }

      if (ownerDmLink) {
        boxes.push({
          text: 'تواصل مع مسؤول المشروع 👤',
          link: ownerDmLink,
        })
      }

      return boxes.length > 0 ? { boxes } : {}
    })(),
  })

  if (!result.success) {
    console.warn('Telegram assignment notification failed:', result)
  }
}