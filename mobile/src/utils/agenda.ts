export function getMonthRange(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const from = new Date(year, month, 1)
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999)

  return {
    from: toDateKey(from),
    to: toDateKey(to),
    label: from.toLocaleDateString('ar-SY', { month: 'long', year: 'numeric' }),
  }
}

export function toDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatAgendaDayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`)
  return date.toLocaleDateString('ar-SY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}
