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

export interface AgendaData {
  myTasks: VmsTask[]
  upcomingEvents: VmsEvent[]
  volunteering: AgendaVolunteeringItem[]
  clubs: VmsClubDashboard[]
  projectNames: Record<string, string>
  timeline: AgendaTimelineItem[]
}

const ACTIVE_TASK_STATUSES = new Set(['open', 'in_progress'])
const ACTIVE_REGISTRATION_STATUSES = new Set(['registered'])

function parseTime(value: string | null | undefined): number {
  if (!value) {
    return Number.POSITIVE_INFINITY
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
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

  const timeline: AgendaTimelineItem[] = [
    ...myTasks.map((task) => ({
      id: `task-${task.id}`,
      kind: 'task' as const,
      title: task.name,
      subtitle: projectNames[task.projectId] ?? null,
      date: task.dueDate,
      href: `/projects/${encodeURIComponent(task.projectId)}`,
    })),
    ...upcomingEvents.map((eventItem) => ({
      id: `event-${eventItem.id}`,
      kind: 'event' as const,
      title: eventItem.name,
      subtitle: eventItem.projectName,
      date: eventItem.startTime,
      href: `/event/${encodeURIComponent(eventItem.id)}`,
    })),
  ].sort((left, right) => parseTime(left.date) - parseTime(right.date))

  return {
    myTasks,
    upcomingEvents,
    volunteering,
    clubs: joinedClubs,
    projectNames,
    timeline: timeline.slice(0, 8),
  }
}
