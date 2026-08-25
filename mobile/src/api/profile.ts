import { apiGetJson, apiPutJson } from '@/src/api/client'
import type { MemberProfile, ProfileUpdatePayload } from '@/src/types/profile'

export function fetchProfile(membershipNumber: string) {
  return apiGetJson<{ profile: MemberProfile }>(
    `/profile/${encodeURIComponent(membershipNumber)}`,
  )
}

export function updateProfile(membershipNumber: string, payload: ProfileUpdatePayload) {
  return apiPutJson<{ profile: MemberProfile }, ProfileUpdatePayload>(
    `/profile/${encodeURIComponent(membershipNumber)}`,
    payload,
  )
}
