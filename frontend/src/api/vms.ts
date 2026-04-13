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
import type { MemberProfile } from '../types/profile'

const MEMBER_MS_BASE_URL = (import.meta.env.VITE_MEMBER_MS as string | undefined)?.trim()
const API_BASE = MEMBER_MS_BASE_URL ? `${MEMBER_MS_BASE_URL.replace(/\/+$/, '')}/api` : '/ms/membership-app/api'

const GET_CACHE_TTL_MS = 1500
const inFlightGetRequests = new Map<string, Promise<unknown>>()
const recentGetResponses = new Map<string, { expiresAt: number; data: unknown }>()

async function fetchJson<T>(path: string): Promise<T> {
  const requestKey = path
  const now = Date.now()

  const cached = recentGetResponses.get(requestKey)
  if (cached && cached.expiresAt > now) {
    return cached.data as T
  }

  const inFlight = inFlightGetRequests.get(requestKey)
  if (inFlight) {
    return inFlight as Promise<T>
  }

  const requestPromise = (async () => {
    const response = await fetch(`${API_BASE}${path}`, { method: 'GET' })

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`)
    }

    const payload = (await response.json()) as T
    recentGetResponses.set(requestKey, {
      data: payload,
      expiresAt: Date.now() + GET_CACHE_TTL_MS,
    })

    return payload
  })()

  inFlightGetRequests.set(requestKey, requestPromise)

  try {
    return await requestPromise
  } finally {
    inFlightGetRequests.delete(requestKey)
  }
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

async function putJson<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
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

export function fetchProfile(membershipNumber: string) {
  return fetchJson<{ profile: MemberProfile }>(`/profile/${encodeURIComponent(membershipNumber)}`)
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

export function updateProject(
  projectId: string,
  payload: Partial<{
    name: string
    description: string
    parentProjectId: string
    owner: string
    telegramGroupId: string
    status: 'active' | 'completed' | 'archived'
  }>,
) {
  return putJson<{ project: VmsProject }, typeof payload>(`/projects/${encodeURIComponent(projectId)}`, payload)
}

export function fetchTasks() {
  return fetchJson<{ tasks: VmsTask[] }>('/tasks')
}

export function createTask(payload: {
  projectId: string
  name: string
  description?: string
  createdBy: string
  status?: 'open' | 'in_progress' | 'completed' | 'archived'
  dueDate?: string
  points?: number
  assignedTo?: string
  skills?: Record<string, string>
}) {
  return postJson<{ task: VmsTask }, typeof payload>('/tasks', payload)
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

export function updateEvent(
  eventId: string,
  payload: Partial<{
    name: string
    description: string
    startTime: string
    endTime: string
    location: string
    createdBy: string
    projectId: string
    skills: Record<string, string>
    telegramGroupId: string
  }>,
) {
  return putJson<{ event: VmsEvent }, typeof payload>(`/events/${encodeURIComponent(eventId)}`, payload)
}

export function fetchEventTickets(eventId?: string) {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''
  return fetchJson<{ eventTickets: VmsEventTicket[] }>(`/event-tickets${query}`)
}

export function createEventTicket(payload: {
  eventId: string
  name: string
  description?: string
  pointPrice: number
  currencyPrice: string
  quantity: number
}) {
  return postJson<{ eventTicket: VmsEventTicket }, typeof payload>('/event-tickets', payload)
}

export function fetchEventRegistrations(eventId?: string) {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''
  return fetchJson<{ eventRegistrations: VmsEventRegistration[] }>(`/event-registrations${query}`)
}

export function createEventRegistration(payload: {
  eventId: string
  membershipNumber: string
  ticketId: string
  status: 'registered' | 'attended' | 'cancelled' | 'no_show'
  approvedBy?: string
}) {
  return postJson<{ eventRegistration: VmsEventRegistration }, typeof payload>('/event-registrations', payload)
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
