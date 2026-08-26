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
