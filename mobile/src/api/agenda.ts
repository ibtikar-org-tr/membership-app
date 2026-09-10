import { apiGetJson } from '@/src/api/client'
import type { AgendaPayload } from '@/src/types/agenda'

export function fetchAgenda(options: {
  from: string
  to: string
  includeUnscheduled?: boolean
}) {
  const params = new URLSearchParams({
    from: options.from,
    to: options.to,
  })
  if (options.includeUnscheduled) {
    params.set('includeUnscheduled', '1')
  }
  return apiGetJson<AgendaPayload>(`/agenda?${params.toString()}`)
}
