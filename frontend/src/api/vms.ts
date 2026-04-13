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

async function deleteJson(path: string): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
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
}

export function login(payload: { identifier: string; password: string }) {
  return postJson<LoginResponse, { identifier: string; password: string }>('/login', payload)
}

export function fetchProfile(membershipNumber: string) {
  return fetchJson<{ profile: MemberProfile }>(`/profile/${encodeURIComponent(membershipNumber)}`)
}

export function fetchProjects(membershipNumber?: string) {
  const query = membershipNumber ? `?membershipNumber=${encodeURIComponent(membershipNumber)}` : ''
  return fetchJson<{ projects: VmsProject[] }>(`/projects${query}`)
}

export function fetchPlatformProjects(membershipNumber?: string) {
  const query = membershipNumber ? `?membershipNumber=${encodeURIComponent(membershipNumber)}` : ''
  return fetchJson<{ projects: VmsProject[] }>(`/projects/platform${query}`)
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

export function fetchProjectById(projectId: string, membershipNumber?: string) {
  const query = membershipNumber ? `?membershipNumber=${encodeURIComponent(membershipNumber)}` : ''
  return fetchJson<{ project: VmsProject }>(`/projects/${encodeURIComponent(projectId)}${query}`)
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

export function updateTask(
  taskId: string,
  payload: Partial<{
    projectId: string
    name: string
    description: string
    createdBy: string
    status: 'open' | 'in_progress' | 'completed' | 'archived'
    dueDate: string
    points: number
    assignedTo: string
    completedBy: string
    completedAt: string
    approvedBy: string
    skills: Record<string, string>
  }>,
) {
  return putJson<{ task: VmsTask }, typeof payload>(`/tasks/${encodeURIComponent(taskId)}`, payload)
}

export function fetchEvents() {
  return fetchJson<{ events: VmsEvent[] }>('/events')
}

export function createEvent(payload: {
  name: string
  description?: string
  startTime?: string
  endTime?: string
  location?: string
  createdBy: string
  projectId?: string
  skills?: Record<string, string>
  telegramGroupId?: string
  imageUrl?: string
  associatedUrls?: Record<string, unknown>
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
    imageUrl: string
    associatedUrls: Record<string, unknown>
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
  currencyPrice?: string
  quantity: number
}) {
  return postJson<{ eventTicket: VmsEventTicket }, typeof payload>('/event-tickets', payload)
}

export function updateEventTicket(
  ticketId: string,
  payload: Partial<{
    eventId: string
    name: string
    description: string
    pointPrice: number
    currencyPrice: string
    quantity: number
  }>,
) {
  return putJson<{ eventTicket: VmsEventTicket }, typeof payload>(`/event-tickets/${encodeURIComponent(ticketId)}`, payload)
}

export function deleteEventTicket(ticketId: string) {
  return deleteJson(`/event-tickets/${encodeURIComponent(ticketId)}`)
}

export function approveEventTicket(ticketId: string, approverMembershipNumber: string) {
  return postJson<{ eventTicket: VmsEventTicket }, unknown>(
    `/event-tickets/${encodeURIComponent(ticketId)}/approve?approver=${encodeURIComponent(approverMembershipNumber)}`,
    {},
  )
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

export function createProjectMember(payload: {
  projectId: string
  membershipNumber: string
  role: 'member' | 'manager' | 'observer'
}) {
  return postJson<{ projectMember: VmsProjectMember }, typeof payload>('/project-members', payload)
}

export function fetchPointTransactions(membershipNumber?: string) {
  const query = membershipNumber ? `?membershipNumber=${encodeURIComponent(membershipNumber)}` : ''
  return fetchJson<{ pointTransactions: VmsPointTransaction[] }>(`/point-transactions${query}`)
}

export async function uploadImages(files: File[]): Promise<{ images: string[] }> {
  const formData = new FormData()

  for (const file of files) {
    formData.append('images', file)
  }

  const response = await fetch(`${API_BASE}/images/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const fallbackMessage = `Upload failed (${response.status})`
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

  const data = (await response.json()) as { success: boolean; imageUrls: Record<string, string> }
  return { images: Object.values(data.imageUrls) }
}

export async function uploadEventBanner(eventId: string, file: File) {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_BASE}/events/${encodeURIComponent(eventId)}/banner`, {
    method: 'PUT',
    body: formData,
  })

  if (!response.ok) {
    const fallbackMessage = `Upload failed (${response.status})`
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

  return (await response.json()) as { event: VmsEvent }
}
