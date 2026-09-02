import { apiGetJson } from '@/src/api/client'
import type { VmsProject, VmsProjectMember } from '@/src/types/projects'

export function fetchDirectProjects() {
  return apiGetJson<{ projects: VmsProject[] }>('/projects/direct')
}

export function fetchProjectById(projectId: string) {
  return apiGetJson<{ project: VmsProject }>(`/projects/${encodeURIComponent(projectId)}`)
}

export function fetchProjectMembers(projectId: string) {
  return apiGetJson<{ projectMembers: VmsProjectMember[] }>(
    `/project-members?projectId=${encodeURIComponent(projectId)}`,
  )
}
