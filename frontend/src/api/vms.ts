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
import type { LoginResponse } from '../types/auth'

const MEMBER_MS_BASE_URL = (import.meta.env.VITE_MEMBER_MS as string | undefined)?.trim()
const API_BASE = MEMBER_MS_BASE_URL ? `${MEMBER_MS_BASE_URL.replace(/\/+$/, '')}/api` : '/ms/membership-app/api'

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { method: 'GET' })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }

  return (await response.json()) as T
}

async function postJson<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const fallbackMessage = `Request failed (${response.status})`
    let message = fallbackMessage

    try {
      const body = (await response.json()) as { error?: unknown }
      if (typeof body.error === 'string' && body.error.trim()) {
        message = body.error
      }
    } catch {
      // Ignore JSON parsing errors and keep fallback message.
    }

    throw new Error(message)
  }

  return (await response.json()) as TResponse
}

export function login(payload: { email: string; password: string }) {
  return postJson<LoginResponse, { email: string; password: string }>('/login', payload)
}

export function fetchProjects() {
  return fetchJson<{ projects: VmsProject[] }>('/projects')
}

export function createProject(payload: {
  name: string
  description?: string
  parentProjectId?: string
  owner: string
  telegramGroupId?: string
  status: 'active' | 'completed' | 'archived'
}) {
  return postJson<{ project: VmsProject }, typeof payload>('/projects', payload)
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

export function createEvent(payload: {
  name: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  createdBy: string
  projectId?: string
  skills?: Record<string, string>
  telegramGroupId?: string
}) {
  return postJson<{ event: VmsEvent }, typeof payload>('/events', payload)
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
