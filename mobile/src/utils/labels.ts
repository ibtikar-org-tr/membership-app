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
  if (!event.startTime) return null

  const deadlineHours = mapCancellationDeadlineHours(event.cancellationDeadlineHours)
  if (deadlineHours <= 0) return null

  const startMs = new Date(event.startTime).getTime()
  if (Number.isNaN(startMs)) return null

  return startMs - deadlineHours * 60 * 60 * 1000
}

export function canSelfModifyRegistration(
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
  if (!registration || !actorMembershipNumber) return false
  if (registration.membershipNumber !== actorMembershipNumber) return false
  if (registration.status !== 'registered') return false
  if (event.status === 'archived') return false

  const cutoffMs = getSelfCancellationCutoffMs(event)
  if (cutoffMs === null) return false

  return Date.now() < cutoffMs
}

export function selfCancellationHelperText(event: {
  startTime: string | null
  cancellationDeadlineHours: number
}) {
  const deadlineHours = mapCancellationDeadlineHours(event.cancellationDeadlineHours)
  if (deadlineHours <= 0) {
    return 'تعديل التسجيل الذاتي غير متاح لهذه الفعالية. تواصل مع المنظمين.'
  }

  const cutoffMs = getSelfCancellationCutoffMs(event)
  if (cutoffMs === null) {
    return 'تعديل التسجيل الذاتي غير متاح قبل تحديد موعد البداية.'
  }

  if (Date.now() >= cutoffMs) {
    return `انتهت مهلة تعديل التسجيل الذاتي (${deadlineHours} ساعة قبل البداية). تواصل مع المنظمين.`
  }

  return `يمكنك إلغاء التسجيل أو تغيير التذكرة حتى ${deadlineHours} ساعة قبل بداية الفعالية.`
}

export function registrationStatusLabel(status: string) {
  if (status === 'registered') return 'مسجل'
  if (status === 'attended') return 'حضر'
  if (status === 'cancelled') return 'ملغي'
  if (status === 'no_show') return 'لم يحضر'
  return status
}

export function taskStatusLabel(status: string) {
  if (status === 'open') return 'مفتوحة'
  if (status === 'in_progress') return 'قيد التنفيذ'
  if (status === 'completed') return 'مكتملة'
  if (status === 'archived') return 'مؤرشفة'
  return status
}

export function taskPriorityLabel(priority: string) {
  if (priority === 'low') return 'منخفضة'
  if (priority === 'medium') return 'متوسطة'
  if (priority === 'high') return 'عالية'
  return priority
}

export function joinPolicyLabel(policy: string) {
  if (policy === 'auto_approve') return 'دخول مباشر'
  if (policy === 'request_to_join') return 'طلب انضمام'
  if (policy === 'invite_only') return 'بدعوة فقط'
  return policy
}
