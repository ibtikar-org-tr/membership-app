import { apiGetJson, apiPostJson } from '@/src/api/client'
import type { VmsClub, VmsClubDashboard, VmsClubMember } from '@/src/types/clubs'

export function fetchClubsDashboard() {
  return apiGetJson<{ clubs: VmsClubDashboard[] }>('/clubs-dashboard')
}

export function fetchClubById(clubId: string) {
  return apiGetJson<{ club: VmsClub }>(`/clubs/${encodeURIComponent(clubId)}`)
}

export function fetchClubMembers(clubId: string) {
  return apiGetJson<{ clubMembers: VmsClubMember[] }>(
    `/club-members?clubId=${encodeURIComponent(clubId)}`,
  )
}

export function joinClub(clubId: string, membershipNumber: string) {
  return apiPostJson<{ clubMember: VmsClubMember }, { clubId: string; membershipNumber: string }>(
    '/club-members',
    { clubId, membershipNumber },
  )
}
