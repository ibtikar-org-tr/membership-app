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

export interface AgendaPayload {
  from: string
  to: string
  tasks: AgendaTaskItem[]
  events: AgendaEventItem[]
  unscheduledTasks: AgendaTaskItem[]
}
