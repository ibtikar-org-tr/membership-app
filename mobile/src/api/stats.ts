import { apiGetJson } from '@/src/api/client'
import type { MemberStats } from '@/src/types/stats'

export function fetchStats() {
  return apiGetJson<MemberStats>('/stats')
}
