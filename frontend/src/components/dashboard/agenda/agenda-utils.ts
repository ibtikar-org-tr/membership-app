export type AgendaItemKind = 'task' | 'event'

export interface AgendaCalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay: boolean
  kind: AgendaItemKind
  href: string
  subtitle: string | null
  backgroundColor: string
  borderColor: string
  textColor: string
}

export interface AgendaTaskItem {
  id: string
  name: string
  status: string
  priority: string
  dueDate: string | null
  projectId: string
  projectName: string | null
}

export interface AgendaEventItem {
  id: string
  name: string
  startTime: string | null
  endTime: string | null
  projectId: string | null
  projectName: string | null
}

export interface AgendaData {
  tasks: AgendaTaskItem[]
  unscheduledTasks: AgendaTaskItem[]
  events: AgendaEventItem[]
  calendarEvents: AgendaCalendarEvent[]
}

const CALENDAR_COLORS = {
  task: { backgroundColor: '#ede9fe', borderColor: '#8b5cf6', textColor: '#5b21b6' },
  event: { backgroundColor: '#ecfeff', borderColor: '#06b6d4', textColor: '#0e7490' },
} as const

function parseTime(value: string | null | undefined): number {
  if (!value) {
    return Number.POSITIVE_INFINITY
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
}

export function toDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function buildAgendaCalendarEvents(input: {
  tasks: AgendaTaskItem[]
  events: AgendaEventItem[]
}): AgendaCalendarEvent[] {
  const calendarEvents: AgendaCalendarEvent[] = []

  for (const task of input.tasks) {
    if (!task.dueDate || task.status === 'completed' || task.status === 'archived') {
      continue
    }

    calendarEvents.push({
      id: `task-${task.id}`,
      title: task.name,
      start: task.dueDate,
      allDay: true,
      kind: 'task',
      href: `/projects/${encodeURIComponent(task.projectId)}`,
      subtitle: task.projectName,
      ...CALENDAR_COLORS.task,
    })
  }

  for (const eventItem of input.events) {
    if (!eventItem.startTime) {
      continue
    }

    calendarEvents.push({
      id: `event-${eventItem.id}`,
      title: eventItem.name,
      start: eventItem.startTime,
      end: eventItem.endTime ?? undefined,
      allDay: !eventItem.endTime,
      kind: 'event',
      href: `/event/${encodeURIComponent(eventItem.id)}`,
      subtitle: eventItem.projectName,
      ...CALENDAR_COLORS.event,
    })
  }

  return calendarEvents
}

export function buildAgendaData(input: {
  tasks: AgendaTaskItem[]
  events: AgendaEventItem[]
  unscheduledTasks?: AgendaTaskItem[]
}): AgendaData {
  return {
    tasks: input.tasks,
    events: input.events,
    unscheduledTasks: input.unscheduledTasks ?? [],
    calendarEvents: buildAgendaCalendarEvents({
      tasks: input.tasks,
      events: input.events,
    }),
  }
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

/** Calendar-month bounds as ISO date strings: [from, to) */
export function getMonthRange(anchor: Date = new Date()): { from: string; to: string } {
  const fromDate = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const toDate = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)
  return {
    from: toDateKey(fromDate),
    to: toDateKey(toDate),
  }
}

/** Prefer FullCalendar visible range, but clamp to one month when possible. */
export function rangeFromDatesSet(start: Date, end: Date): { from: string; to: string } {
  return {
    from: toDateKey(start),
    to: toDateKey(end),
  }
}
