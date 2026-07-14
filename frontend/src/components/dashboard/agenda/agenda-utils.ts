import type {
  VmsClubDashboard,
  VmsEvent,
  VmsEventRegistration,
  VmsPosition,
  VmsPositionApplication,
  VmsProject,
  VmsTask,
} from '../../../types/vms'

export type AgendaItemKind = 'task' | 'event' | 'volunteering' | 'club'

export interface AgendaTimelineItem {
  id: string
  kind: AgendaItemKind
  title: string
  subtitle: string | null
  date: string | null
  href: string
}

export interface AgendaVolunteeringItem {
  position: VmsPosition
  application: VmsPositionApplication
}

export interface AgendaCalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay: boolean
  kind: 'task' | 'event' | 'volunteering'
  href: string
  subtitle: string | null
  backgroundColor: string
  borderColor: string
  textColor: string
}

export interface AgendaData {
  myTasks: VmsTask[]
  unscheduledTasks: VmsTask[]
  upcomingEvents: VmsEvent[]
  volunteering: AgendaVolunteeringItem[]
  clubs: VmsClubDashboard[]
  projectNames: Record<string, string>
  calendarEvents: AgendaCalendarEvent[]
}

const ACTIVE_TASK_STATUSES = new Set(['open', 'in_progress'])
const ACTIVE_REGISTRATION_STATUSES = new Set(['registered'])

const CALENDAR_COLORS = {
  task: { backgroundColor: '#ede9fe', borderColor: '#8b5cf6', textColor: '#5b21b6' },
  event: { backgroundColor: '#ecfeff', borderColor: '#06b6d4', textColor: '#0e7490' },
  volunteering: { backgroundColor: '#ecfdf5', borderColor: '#10b981', textColor: '#047857' },
} as const

function parseTime(value: string | null | undefined): number {
  if (!value) {
    return Number.POSITIVE_INFINITY
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}

function toDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isActiveTask(task: VmsTask, membershipNumber: string): boolean {
  return task.assignedTo === membershipNumber && ACTIVE_TASK_STATUSES.has(task.status)
}

function isUpcomingEvent(eventItem: VmsEvent, now: Date): boolean {
  const nowMs = now.getTime()

  if (eventItem.endTime) {
    const endTime = Date.parse(eventItem.endTime)
    if (Number.isFinite(endTime) && endTime <= nowMs) {
      return false
    }
  }

  if (eventItem.startTime) {
    const startTime = Date.parse(eventItem.startTime)
    if (Number.isFinite(startTime) && startTime <= nowMs) {
      if (!eventItem.endTime) {
        return false
      }

      const endTime = Date.parse(eventItem.endTime)
      return Number.isFinite(endTime) && endTime > nowMs
    }

    return true
  }

  return false
}

export function buildAgendaCalendarEvents(input: {
  myTasks: VmsTask[]
  upcomingEvents: VmsEvent[]
  projectNames: Record<string, string>
}): AgendaCalendarEvent[] {
  const events: AgendaCalendarEvent[] = []

  for (const task of input.myTasks) {
    if (!task.dueDate) {
      continue
    }

    const colors = CALENDAR_COLORS.task
    events.push({
      id: `task-${task.id}`,
      title: task.name,
      start: task.dueDate,
      allDay: true,
      kind: 'task',
      href: `/projects/${encodeURIComponent(task.projectId)}`,
      subtitle: input.projectNames[task.projectId] ?? null,
      ...colors,
    })
  }

  for (const eventItem of input.upcomingEvents) {
    if (!eventItem.startTime) {
      continue
    }

    const colors = CALENDAR_COLORS.event
    events.push({
      id: `event-${eventItem.id}`,
      title: eventItem.name,
      start: eventItem.startTime,
      end: eventItem.endTime ?? undefined,
      allDay: !eventItem.endTime,
      kind: 'event',
      href: `/event/${encodeURIComponent(eventItem.id)}`,
      subtitle: eventItem.projectName,
      ...colors,
    })
  }

  return events
}

export function groupCalendarEventsByDate(events: AgendaCalendarEvent[]): Map<string, AgendaCalendarEvent[]> {
  const grouped = new Map<string, AgendaCalendarEvent[]>()

  for (const eventItem of events) {
    const startKey = toDateKey(eventItem.start)
    const existing = grouped.get(startKey) ?? []
    existing.push(eventItem)
    grouped.set(startKey, existing)

    if (eventItem.end && !eventItem.allDay) {
      const startDate = new Date(eventItem.start)
      const endDate = new Date(eventItem.end)
      const cursor = new Date(startDate)
      cursor.setDate(cursor.getDate() + 1)
      cursor.setHours(0, 0, 0, 0)

      while (cursor < endDate) {
        const key = toDateKey(cursor)
        if (key !== startKey) {
          const dayEvents = grouped.get(key) ?? []
          if (!dayEvents.some((entry) => entry.id === eventItem.id)) {
            dayEvents.push(eventItem)
            grouped.set(key, dayEvents)
          }
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }
  }

  for (const [key, dayEvents] of grouped) {
    grouped.set(
      key,
      [...dayEvents].sort((left, right) => parseTime(left.start) - parseTime(right.start)),
    )
  }

  return grouped
}

export function buildAgendaData(input: {
  membershipNumber: string
  tasks: VmsTask[]
  events: VmsEvent[]
  registrations: VmsEventRegistration[]
  positions: VmsPosition[]
  projects: VmsProject[]
  clubs: VmsClubDashboard[]
}): AgendaData {
  const now = new Date()
  const projectNames = Object.fromEntries(input.projects.map((project) => [project.id, project.name]))

  const activeRegistrationEventIds = new Set(
    input.registrations
      .filter((registration) => ACTIVE_REGISTRATION_STATUSES.has(registration.status))
      .map((registration) => registration.eventId),
  )

  const upcomingEvents = input.events
    .filter((eventItem) => activeRegistrationEventIds.has(eventItem.id) && isUpcomingEvent(eventItem, now))
    .sort((left, right) => parseTime(left.startTime) - parseTime(right.startTime))

  const myTasks = input.tasks
    .filter((task) => isActiveTask(task, input.membershipNumber))
    .sort((left, right) => {
      const dueDiff = parseTime(left.dueDate) - parseTime(right.dueDate)
      if (dueDiff !== 0) {
        return dueDiff
      }

      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (priorityOrder[left.priority] ?? 3) - (priorityOrder[right.priority] ?? 3)
    })

  const unscheduledTasks = myTasks.filter((task) => !task.dueDate)

  const volunteering = input.positions.flatMap((position) => {
    const application = position.applications.find(
      (entry) => entry.membershipNumber === input.membershipNumber && entry.status === 'pending',
    )

    if (!application) {
      return []
    }

    return [{ position, application }]
  })

  const joinedClubs = input.clubs.filter((club) => club.isJoined)

  const calendarEvents = buildAgendaCalendarEvents({
    myTasks,
    upcomingEvents,
    projectNames,
  })

  return {
    myTasks,
    unscheduledTasks,
    upcomingEvents,
    volunteering,
    clubs: joinedClubs,
    projectNames,
    calendarEvents,
  }
}

export { toDateKey }
