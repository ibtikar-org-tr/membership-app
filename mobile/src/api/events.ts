import { apiGetJson } from '@/src/api/client'
import type { VmsEvent } from '@/src/types/events'

export function fetchEvents() {
  return apiGetJson<{ events: VmsEvent[] }>('/events')
}

export function fetchEventById(eventId: string) {
  return apiGetJson<{ event: VmsEvent }>(`/events/${encodeURIComponent(eventId)}`)
}
