export interface VmsProject {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description: string | null
  parentProjectId: string | null
  owner: string
  telegramGroupId: string | null
  status: 'active' | 'completed' | 'archived' | string
}

export interface VmsTask {
  id: string
  createdAt: string
  updatedAt: string
  projectId: string
  name: string
  description: string | null
  createdBy: string
  status: 'open' | 'in_progress' | 'completed' | 'archived' | string
  dueDate: string | null
  points: number
  assignedTo: string | null
  completedBy: string | null
  completedAt: string | null
  approvedBy: string | null
  skills: Record<string, string> | null
}

export interface VmsEvent {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description: string | null
  startTime: string
  endTime: string
  location: string | null
  createdBy: string
  projectId: string | null
  skills: Record<string, string> | null
  telegramGroupId: string | null
}

export interface VmsEventTicket {
  id: string
  createdAt: string
  updatedAt: string
  eventId: string
  name: string
  description: string | null
  pointPrice: number
  currencyPrice: string
  quantity: number
}

export interface VmsEventRegistration {
  id: string
  createdAt: string
  updatedAt: string
  eventId: string
  membershipNumber: string
  ticketId: string
  status: 'registered' | 'attended' | 'cancelled' | 'no_show' | string
  approvedBy: string | null
}

export interface VmsSkill {
  name: string
  createdAt: string
  updatedAt: string
  description: string | null
  members: number | null
  events: number | null
  tasks: number | null
}

export interface VmsProjectMember {
  projectId: string
  membershipNumber: string
  role: 'member' | 'manager' | 'observer' | string
  displayName: string
}

export interface VmsPointTransaction {
  id: string
  createdAt: string
  updatedAt: string
  membershipNumber: string
  taskId: string | null
  amount: number
  type: 'task_reward' | 'purchase' | 'event_attendance' | 'other' | string
}
