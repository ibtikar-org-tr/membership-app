function parseDate(input: string | Date | null | undefined): Date | null {
  if (input === null || input === undefined || input === '') {
    return null
  }

  const candidate = input instanceof Date ? input : new Date(input)

  if (Number.isNaN(candidate.getTime())) {
    return null
  }

  return candidate
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatDateEnCA(input: string | Date | null | undefined): string {
  const date = parseDate(input)

  if (!date) {
    return '-'
  }

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())

  return `${year}-${month}-${day}`
}

export function formatDateTimeEnCA(input: string | Date | null | undefined): string {
  const date = parseDate(input)

  if (!date) {
    return '-'
  }

  // Get timezone offset
  const timezoneOffset = -date.getTimezoneOffset()
  const offsetHours = Math.floor(timezoneOffset / 60)
  const offsetMinutes = timezoneOffset % 60
  const timezoneString = `GMT+${offsetHours}${offsetMinutes !== 0 ? String(offsetMinutes).padStart(2, '0') : ''}`

  const datePart = formatDateEnCA(date)
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${datePart} ${hours}:${minutes} ${timezoneString}`
}
