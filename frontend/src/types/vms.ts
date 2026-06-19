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
  skills: Record<string, string> | null
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
  priority: 'low' | 'medium' | 'high' | string
  dueDate: string | null
  points: number
  assignedTo: string | null
  completedBy: string | null
  completedAt: string | null
  approvedBy: string | null
  lastRemindedAt: string | null
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
  displayAttendeeNumbers: boolean
  cancellationDeadlineHours: number
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
  displayName?: string
  ticketId: string
  status: 'registered' | 'attended' | 'cancelled' | 'no_show' | string
  paymentApprovedBy: string | null
  attendanceApprovedBy: string | null
}

export interface VmsSkill {
  id: string
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

export interface VmsProjectMemberContact {
  membershipNumber: string
  email: string
  enName: string | null
  arName: string | null
  phoneNumber: string | null
  telegramUsername: string | null
}

export interface VmsPositionApplication {
  id: string
  createdAt: string
  updatedAt: string
  positionId: string
  membershipNumber: string
  motivationLetter: string | null
  status: 'pending' | 'accepted' | 'rejected' | string
  reviewedBy: string | null
  displayName: string
  reviewedByDisplayName: string | null
}

export interface VmsPosition {
  id: string
  createdAt: string
  updatedAt: string
  projectId: string
  projectName: string | null
  name: string
  description: string | null
  createdBy: string
  createdByDisplayName: string
  seats: number
  status: 'open' | 'filled' | 'closed' | string
  acceptedApplicationsCount: number
  applications: VmsPositionApplication[]
}

export interface VmsClub {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description: string | null
  projectId: string
  imageUrl: string | null
  telegramGroupId: string | null
  country: string | null
  region: string | null
  city: string | null
  address: string | null
  visibility: 'public' | 'private' | 'draft' | string
  joinPolicy: 'auto_approve' | 'request_to_join' | 'invite_only' | string
  skills: Record<string, string> | null
}

export interface VmsClubDashboard extends VmsClub {
  projectName: string | null
  membersCount: number
  isJoined: boolean
}

export interface VmsClubMember {
  clubId: string
  membershipNumber: string
  status: 'active' | 'pending' | 'rejected' | string
  displayName: string
}

export interface VmsPointTransaction {
  id: string
  createdAt: string
  updatedAt: string
  membershipNumber: string
  taskId: string | null
  amount: number
  type: 'task_reward' | 'task_reward_reversal' | 'purchase' | 'event_attendance' | 'other' | string
}
