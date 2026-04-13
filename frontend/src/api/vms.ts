import type {
  VmsEvent,
  VmsEventRegistration,
  VmsEventTicket,
  VmsPointTransaction,
  VmsProject,
  VmsProjectMember,
  VmsSkill,
  VmsTask,
} from '../types/vms'

const MEMBER_MS_BASE_URL = (import.meta.env.VITE_MEMBER_MS as string | undefined)?.trim()
const API_BASE = MEMBER_MS_BASE_URL ? `${MEMBER_MS_BASE_URL.replace(/\/+$/, '')}/api` : '/ms/membership-app/api'

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { method: 'GET' })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }

  return (await response.json()) as T
}

export function fetchProjects() {
  return fetchJson<{ projects: VmsProject[] }>('/projects')
}

export function fetchProjectById(projectId: string) {
  return fetchJson<{ project: VmsProject }>(`/projects/${encodeURIComponent(projectId)}`)
}

export function fetchTasks() {
  return fetchJson<{ tasks: VmsTask[] }>('/tasks')
}

export function fetchEvents() {
  return fetchJson<{ events: VmsEvent[] }>('/events')
}

export function fetchEventById(eventId: string) {
  return fetchJson<{ event: VmsEvent }>(`/events/${encodeURIComponent(eventId)}`)
}

export function fetchEventTickets(eventId?: string) {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''
  return fetchJson<{ eventTickets: VmsEventTicket[] }>(`/event-tickets${query}`)
}

export function fetchEventRegistrations(eventId?: string) {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''
  return fetchJson<{ eventRegistrations: VmsEventRegistration[] }>(`/event-registrations${query}`)
}

export function fetchSkills() {
  return fetchJson<{ skills: VmsSkill[] }>('/skills')
}

export function fetchProjectMembers(projectId?: string) {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''
  return fetchJson<{ projectMembers: VmsProjectMember[] }>(`/project-members${query}`)
}

export function fetchPointTransactions(membershipNumber?: string) {
  const query = membershipNumber ? `?membershipNumber=${encodeURIComponent(membershipNumber)}` : ''
  return fetchJson<{ pointTransactions: VmsPointTransaction[] }>(`/point-transactions${query}`)
}
