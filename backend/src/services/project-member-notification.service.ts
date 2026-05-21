import type { AppBindings } from '../types/bindings'
import { sendBackendTelegramNotification } from './telegram-notification.service'

interface ProjectMemberRemovalNotification {
  frontendBaseUrl?: string
  projectId: string
  projectName: string | null
  actorMembershipNumber: string
  removedMembershipNumber: string
  actorDisplayName: string
  removedDisplayName: string
  isSelfLeave: boolean
  projectOwnerMembershipNumber: string
}

function trimLabel(value: string | null | undefined) {
  return value?.trim() || 'غير محدد'
}

function formatMemberLabel(displayName: string, membershipNumber: string) {
  const name = displayName.trim() || membershipNumber
  return name === membershipNumber ? membershipNumber : `${name} (${membershipNumber})`
}

function buildProjectLink(frontendBaseUrl: string | undefined, projectId: string) {
  const baseUrl = frontendBaseUrl?.trim().replace(/\/+$/, '')
  return baseUrl ? `${baseUrl}/dashboard/projects/${encodeURIComponent(projectId)}` : null
}

function buildProjectsListLink(frontendBaseUrl: string | undefined) {
  const baseUrl = frontendBaseUrl?.trim().replace(/\/+$/, '')
  return baseUrl ? `${baseUrl}/dashboard/projects` : null
}

export async function notifyProjectMemberRemoved(env: AppBindings, context: ProjectMemberRemovalNotification) {
  const projectLabel = trimLabel(context.projectName)
  const removedLabel = formatMemberLabel(context.removedDisplayName, context.removedMembershipNumber)
  const projectLink = buildProjectLink(context.frontendBaseUrl, context.projectId)
  const projectsListLink = buildProjectsListLink(context.frontendBaseUrl)

  if (context.isSelfLeave) {
    const selfLeaveMessage = ['👋 مغادرة مشروع', `غادرت مشروع «${projectLabel}».`].join('\n')

    const selfResult = await sendBackendTelegramNotification(env, {
      target: context.removedMembershipNumber,
      message: selfLeaveMessage,
      ...(projectsListLink
        ? {
            boxes: [{ text: 'عرض مشاريعي', link: projectsListLink }],
          }
        : {}),
    })

    if (!selfResult.success) {
      console.warn('Failed to notify member about leaving project:', selfResult)
    }

    if (context.projectOwnerMembershipNumber === context.removedMembershipNumber) {
      return
    }

    const ownerMessage = [
      '👋 مغادرة عضو',
      `غادر ${removedLabel} مشروع «${projectLabel}».`,
    ].join('\n')

    const ownerResult = await sendBackendTelegramNotification(env, {
      target: context.projectOwnerMembershipNumber,
      message: ownerMessage,
      ...(projectLink
        ? {
            boxes: [{ text: 'فتح المشروع', link: projectLink }],
          }
        : {}),
    })

    if (!ownerResult.success) {
      console.warn('Failed to notify project owner about member leaving:', ownerResult)
    }

    return
  }

  if (context.actorMembershipNumber !== context.removedMembershipNumber) {
    const actorMessage = [
      '📤 إزالة عضو من المشروع',
      `لقد أزلت ${removedLabel} من مشروع «${projectLabel}».`,
    ].join('\n')

    const actorResult = await sendBackendTelegramNotification(env, {
      target: context.actorMembershipNumber,
      message: actorMessage,
      ...(projectLink
        ? {
            boxes: [{ text: 'فتح المشروع', link: projectLink }],
          }
        : {}),
    })

    if (!actorResult.success) {
      console.warn('Failed to notify actor about project member removal:', actorResult)
    }
  }

  const removedMessage = [
    '📤 إزالة من المشروع',
    `تمت إزالتك من مشروع «${projectLabel}».`,
  ].join('\n')

  const removedResult = await sendBackendTelegramNotification(env, {
    target: context.removedMembershipNumber,
    message: removedMessage,
    ...(projectsListLink
      ? {
          boxes: [{ text: 'عرض مشاريعي', link: projectsListLink }],
        }
      : {}),
  })

  if (!removedResult.success) {
    console.warn('Failed to notify removed project member:', removedResult)
  }
}
