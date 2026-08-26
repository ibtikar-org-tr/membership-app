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
  activeRegistrationCount?: number
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
