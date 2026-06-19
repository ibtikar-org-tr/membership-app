export function mapCancellationDeadlineHours(value: number | null | undefined) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 48
  }

  return Math.max(0, Math.trunc(value))
}

export function getSelfCancellationCutoffMs(event: {
  startTime: string | null
  cancellationDeadlineHours: number
}) {
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
  event: {
    startTime: string | null
    status: string
    cancellationDeadlineHours: number
  },
  registration: {
    membershipNumber: string
    status: string
  } | null,
  actorMembershipNumber: string | null | undefined,
) {
  if (!registration || !actorMembershipNumber) {
    return false
  }

  if (registration.membershipNumber !== actorMembershipNumber) {
    return false
  }

  if (registration.status !== 'registered') {
    return false
  }

  if (event.status === 'archived') {
    return false
  }

  const cutoffMs = getSelfCancellationCutoffMs(event)
  if (cutoffMs === null) {
    return false
  }

  return Date.now() < cutoffMs
}

export function selfCancellationHelperText(event: {
  startTime: string | null
  cancellationDeadlineHours: number
}) {
  const deadlineHours = mapCancellationDeadlineHours(event.cancellationDeadlineHours)
  if (deadlineHours <= 0) {
    return 'الإلغاء الذاتي غير متاح لهذه الفعالية. تواصل مع المنظمين.'
  }

  const cutoffMs = getSelfCancellationCutoffMs(event)
  if (cutoffMs === null) {
    return 'الإلغاء الذاتي غير متاح قبل تحديد موعد البداية.'
  }

  if (Date.now() >= cutoffMs) {
    return `انتهت مهلة الإلغاء الذاتي (${deadlineHours} ساعة قبل البداية). تواصل مع المنظمين.`
  }

  return `يمكنك إلغاء تسجيلك حتى ${deadlineHours} ساعة قبل بداية الفعالية.`
}
