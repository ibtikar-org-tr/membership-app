import { apiDeleteJson, apiGetJson, apiPostJson } from '@/src/api/client'
import type {
  VmsProject,
  VmsProjectMember,
  VmsProjectMemberContact,
  VmsProjectNote,
} from '@/src/types/projects'
import type { VmsPosition } from '@/src/types/community'
import type { VmsClub } from '@/src/types/clubs'

export function fetchDirectProjects() {
  // Main projects list; backend omits archived projects.
  return apiGetJson<{ projects: VmsProject[] }>('/projects/direct')
}

export function fetchProjects() {
  // Includes archived; used when resolving sub-projects under a parent.
  return apiGetJson<{ projects: VmsProject[] }>('/projects')
}

export function fetchProjectById(projectId: string) {
  return apiGetJson<{ project: VmsProject }>(`/projects/${encodeURIComponent(projectId)}`)
}

export function fetchProjectMembers(projectId: string) {
  return apiGetJson<{ projectMembers: VmsProjectMember[] }>(
    `/project-members?projectId=${encodeURIComponent(projectId)}`,
  )
}

export function fetchProjectMemberContact(projectId: string, membershipNumber: string) {
  return apiGetJson<{ contact: VmsProjectMemberContact }>(
    `/project-members/${encodeURIComponent(projectId)}/${encodeURIComponent(membershipNumber)}/contact`,
  )
}

export function fetchProjectPositions(projectId: string) {
  return apiGetJson<{ positions: VmsPosition[] }>(
    `/positions?projectId=${encodeURIComponent(projectId)}`,
  )
}

export function fetchProjectClubs(projectId: string) {
  return apiGetJson<{ clubs: VmsClub[] }>(`/clubs?projectId=${encodeURIComponent(projectId)}`)
}

export function fetchProjectNotes(projectId: string) {
  return apiGetJson<{ projectNotes: VmsProjectNote[] }>(
    `/project-notes?projectId=${encodeURIComponent(projectId)}`,
  )
}

export function leaveProject(projectId: string, membershipNumber: string) {
  return apiDeleteJson(
    `/project-members/${encodeURIComponent(projectId)}/${encodeURIComponent(membershipNumber)}`,
  )
}

export function requestTelegramGroupInvite(payload: {
  resourceType: 'project' | 'club' | 'event'
  resourceId: string
}) {
  return apiPostJson<{ success: boolean; detail?: string }, typeof payload>(
    '/telegram/group-invite',
    payload,
  )
}
