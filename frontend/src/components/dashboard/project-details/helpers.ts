import { formatDateEnCA } from '../../../utils/date-format'

export function statusLabel(status: string) {
  if (status === 'completed') {
    return 'مكتمل'
  }

  if (status === 'active') {
    return 'نشط'
  }

  if (status === 'archived') {
    return 'مؤرشف'
  }

  return status
}

export function taskStatusLabel(status: string) {
  if (status === 'completed') {
    return 'مكتملة'
  }

  if (status === 'in_progress') {
    return 'قيد التنفيذ'
  }

  if (status === 'open') {
    return 'مفتوحة'
  }

  if (status === 'archived') {
    return 'مؤرشفة'
  }

  return status
}

export function statusBadgeClass(status: string) {
  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'in_progress') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (status === 'archived') {
    return 'border-slate-200 bg-slate-100 text-slate-600'
  }

  return 'border-cyan-200 bg-cyan-50 text-cyan-700'
}

export function taskPriorityLabel(priority: string) {
  if (priority === 'high') {
    return 'عالية'
  }

  if (priority === 'low') {
    return 'منخفضة'
  }

  if (priority === 'medium') {
    return 'متوسطة'
  }

  return priority
}

export function priorityBadgeClass(priority: string) {
  if (priority === 'high') {
    return 'border-rose-200 bg-rose-50 text-rose-800'
  }

  if (priority === 'low') {
    return 'border-slate-200 bg-slate-100 text-slate-600'
  }

  return 'border-amber-200 bg-amber-50 text-amber-800'
}

export function priorityTone(priority: string) {
  if (priority === 'high') {
    return 'bg-rose-500'
  }

  if (priority === 'low') {
    return 'bg-slate-400'
  }

  return 'bg-amber-500'
}

export function laneStyle(status: string) {
  if (status === 'completed') {
    return {
      lane: 'border-emerald-200/80 bg-emerald-50/70',
      head: 'from-emerald-100 to-emerald-50 text-emerald-900',
    }
  }

  if (status === 'in_progress') {
    return {
      lane: 'border-amber-200/80 bg-amber-50/70',
      head: 'from-amber-100 to-amber-50 text-amber-900',
    }
  }

  if (status === 'archived') {
    return {
      lane: 'border-slate-300/80 bg-slate-100/80',
      head: 'from-slate-200 to-slate-100 text-slate-700',
    }
  }

  return {
    lane: 'border-cyan-200/80 bg-cyan-50/70',
    head: 'from-cyan-100 to-cyan-50 text-cyan-900',
  }
}

export function memberInitials(displayName: string, membershipNumber: string) {
  const nonJoining = (value: string) => value.split('').join('\u200C')

  const value = displayName.trim()
  if (!value) {
    return nonJoining(membershipNumber.slice(-2).toUpperCase())
  }

  const segments = value.split(/\s+/).filter(Boolean)
  if (segments.length === 1) {
    return nonJoining(segments[0].slice(0, 2).toUpperCase())
  }

  return nonJoining(`${segments[0][0] ?? ''}${segments[1][0] ?? ''}`.toUpperCase())
}

export function memberAvatarTone(membershipNumber: string) {
  const tones = [
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-rose-100 text-rose-800 border-rose-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
  ]

  const code = membershipNumber
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return tones[code % tones.length]
}

export function formatDueDate(value: string | null) {
  if (!value) {
    return 'بدون موعد'
  }

  return formatDateEnCA(value)
}
