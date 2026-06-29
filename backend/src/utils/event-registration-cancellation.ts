import type { D1DatabaseLike } from '../types/bindings'
import { getTicketActiveRegistrationCount } from './event-registration-counts'

interface EventCancellationSettings {
  startTime: string | null
  status: string
  cancellationDeadlineHours: number
}

interface RegistrationForCancellation {
  membershipNumber: string
  status: string
}

export function mapCancellationDeadlineHours(value: number | null | undefined) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 48
  }

  return Math.max(0, Math.trunc(value))
}

export function getSelfCancellationCutoffMs(event: EventCancellationSettings) {
  if (!event.startTime) {
    return null
  }

  const deadlineHours = mapCancellationDeadlineHours(event.cancellationDeadlineHours)
  if (deadlineHours <= 0) {
    return null
  }

  const startMs = new Date(event.startTime).getTime()
  if (Number.isNaN(startMs)) {
    return null
  }

  return startMs - deadlineHours * 60 * 60 * 1000
}

export function canSelfCancelRegistration(
  event: EventCancellationSettings,
  registration: RegistrationForCancellation,
  actorMembershipNumber: string,
) {
  return canSelfModifyRegistration(event, registration, actorMembershipNumber)
}

export function canSelfModifyRegistration(
  event: EventCancellationSettings,
  registration: RegistrationForCancellation,
  actorMembershipNumber: string,
) {
  if (registration.membershipNumber !== actorMembershipNumber) {
    return { allowed: false as const, reason: 'يمكنك تعديل تسجيلك فقط.' }
  }

  if (registration.status !== 'registered') {
    return { allowed: false as const, reason: 'لا يمكن تعديل هذا التسجيل في حالته الحالية.' }
  }

  if (event.status === 'archived') {
    return { allowed: false as const, reason: 'هذه الفعالية مؤرشفة ولا يمكن تعديل التسجيل فيها.' }
  }

  if (!event.startTime) {
    return { allowed: false as const, reason: 'لا يمكن تعديل التسجيل قبل تحديد موعد بداية الفعالية.' }
  }

  const deadlineHours = mapCancellationDeadlineHours(event.cancellationDeadlineHours)
  if (deadlineHours <= 0) {
    return { allowed: false as const, reason: 'تعديل التسجيل الذاتي غير متاح لهذه الفعالية. تواصل مع المنظمين.' }
  }

  const cutoffMs = getSelfCancellationCutoffMs(event)
  if (cutoffMs === null || Date.now() >= cutoffMs) {
    return {
      allowed: false as const,
      reason: `انتهت مهلة تعديل التسجيل الذاتي (${deadlineHours} ساعة قبل بداية الفعالية). تواصل مع المنظمين.`,
    }
  }

  return { allowed: true as const }
}

export async function countActiveRegistrationsForTicket(db: D1DatabaseLike, ticketId: string) {
  return getTicketActiveRegistrationCount(db, ticketId)
}
