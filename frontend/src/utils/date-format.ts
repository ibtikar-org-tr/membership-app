function parseDate(input: string | Date): Date | null {
  const candidate = input instanceof Date ? input : new Date(input)

  if (Number.isNaN(candidate.getTime())) {
    return null
  }

  return candidate
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDateEnCA(input: string | Date): string {
  const date = parseDate(input)

  if (!date) {
    return '-'
  }

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())

  return `${year}-${month}-${day}`
}

export function formatDateTimeEnCA(input: string | Date): string {
  const date = parseDate(input)

  if (!date) {
    return '-'
  }

  const datePart = formatDateEnCA(date)
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return `${datePart}T${hours}:${minutes}:${seconds}`
}
