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

export interface VmsLeaderboardEntry {
  name: string
  points: number
  isViewer?: boolean
}

export interface VmsLeaderboardViewer {
  rank: number
  points: number
}
