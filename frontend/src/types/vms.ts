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
  startTime: string | null
  endTime: string | null
  status: 'draft' | 'public' | 'archived' | string
  imageUrl: string | null
  associatedUrls: Record<string, unknown> | null
  createdBy: string
  projectId: string | null
  projectName: string | null
  projectOwner: string | null
  skills: Record<string, string> | null
  telegramGroupId: string | null
  country: string | null
  region: string | null
  city: string | null
  address: string | null
}

export interface VmsEventTicket {
  id: string
  createdAt: string
  updatedAt: string
  eventId: string
  name: string
  description: string | null
  pointPrice: number
  currencyPrice: string | null
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
  paymentApprovedBy: string | null
  attendanceApprovedBy: string | null
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
