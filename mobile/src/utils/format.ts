export function formatEventDate(value: string | null): string {
  if (!value) {
    return 'غير محدد'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('ar', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatEventLocation(event: {
  city: string | null
  region: string | null
  country: string | null
  address: string | null
}): string {
  const parts = [event.city, event.region, event.country].filter(
    (part): part is string => Boolean(part?.trim()),
  )

  if (parts.length > 0) {
    return parts.join('، ')
  }

  if (event.address?.trim()) {
    return event.address.trim()
  }

  return 'الموقع غير محدد'
}
