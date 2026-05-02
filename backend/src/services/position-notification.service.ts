import type { AppBindings } from '../types/bindings'
import { sendBackendTelegramNotification } from './telegram-notification.service'

interface PositionNotificationContext {
  frontendBaseUrl?: string
  projectId: string
  projectName: string | null
  positionId: string
  positionName: string
}

interface PositionApplicationSubmittedNotification extends PositionNotificationContext {
  applicantMembershipNumber: string
  applicantDisplayName: string
  ownerMembershipNumber: string
}

interface PositionApplicationReviewedNotification extends PositionNotificationContext {
  applicantMembershipNumber: string
  decision: 'accepted' | 'rejected'
}

function trimLabel(value: string | null | undefined) {
  return value?.trim() || 'غير محدد'
}

function buildOpenPositionsLink(frontendBaseUrl: string | undefined) {
  const baseUrl = frontendBaseUrl?.trim().replace(/\/+$/, '')
  return baseUrl ? `${baseUrl}/dashboard/volunteering` : null
}

function buildProjectPositionsLink(frontendBaseUrl: string | undefined, projectId: string) {
  const baseUrl = frontendBaseUrl?.trim().replace(/\/+$/, '')
  return baseUrl ? `${baseUrl}/dashboard/projects/${encodeURIComponent(projectId)}/positions` : null
}

export async function notifyPositionApplicationSubmitted(env: AppBindings, context: PositionApplicationSubmittedNotification) {
  const projectLabel = trimLabel(context.projectName)

  const ownerResult = await sendBackendTelegramNotification(env, {
    target: context.ownerMembershipNumber,
    message: [
      '💚 طلب تطوع جديد',
      `الفرصة: ${context.positionName}`, 
      `المشروع: ${projectLabel}`,
      `المتقدم: ${context.applicantDisplayName} (${context.applicantMembershipNumber})`,
      'راجع الطلب من صفحة الفرص التطوعية.',
    ].join('\n'),
    ...(buildProjectPositionsLink(context.frontendBaseUrl, context.projectId)
      ? {
          boxes: [
            {
              text: 'فتح الفرص التطوعية',
              link: buildProjectPositionsLink(context.frontendBaseUrl, context.projectId)!,
            },
          ],
        }
      : {}),
  })

  if (!ownerResult.success) {
    console.warn('Failed to notify position owner about new application:', ownerResult)
  }

  if (context.applicantMembershipNumber === context.ownerMembershipNumber) {
    return
  }

  const applicantResult = await sendBackendTelegramNotification(env, {
    target: context.applicantMembershipNumber,
    message: [
      '✅ تم استلام طلب التطوع',
      `الفرصة: ${context.positionName}`,
      `المشروع: ${projectLabel}`,
      'سيتم إشعارك عند مراجعة الطلب.',
    ].join('\n'),
    ...(buildOpenPositionsLink(context.frontendBaseUrl)
      ? {
          boxes: [
            {
              text: 'استعراض الفرص المفتوحة',
              link: buildOpenPositionsLink(context.frontendBaseUrl)!,
            },
          ],
        }
      : {}),
  })

  if (!applicantResult.success) {
    console.warn('Failed to notify applicant about submitted application:', applicantResult)
  }
}

export async function notifyPositionApplicationReviewed(env: AppBindings, context: PositionApplicationReviewedNotification) {
  const projectLabel = trimLabel(context.projectName)
  const message = [
    context.decision === 'accepted' ? '✅ تم قبول طلبك' : '❌ تم رفض طلبك',
    `الفرصة: ${context.positionName}`,
    `المشروع: ${projectLabel}`,
    context.decision === 'accepted'
      ? 'تمت إضافة عضويتك إلى المشروع.'
      : 'يمكنك التقديم على فرص أخرى مفتوحة لاحقاً.',
  ].join('\n')

  const result = await sendBackendTelegramNotification(env, {
    target: context.applicantMembershipNumber,
    message,
    ...(buildOpenPositionsLink(context.frontendBaseUrl)
      ? {
          boxes: [
            {
              text: 'الفرص التطوعية المفتوحة',
              link: buildOpenPositionsLink(context.frontendBaseUrl)!,
            },
          ],
        }
      : {}),
  })

  if (!result.success) {
    console.warn('Failed to notify applicant about position review:', result)
  }
}