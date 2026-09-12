export interface VmsProject {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description: string | null
  parentProjectId: string | null
  owner: string
  ownerDisplayName?: string
  telegramGroupId: string | null
  status: 'active' | 'completed' | 'archived' | string
  skills: Record<string, string> | null
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

export interface VmsProjectNote {
  id: string
  createdAt: string
  updatedAt: string
  projectId: string
  title: string
  content: string
  contentPreview: string | null
  contentType?: 'html' | 'markdown'
  createdBy: string
  createdByDisplayName?: string
  canEdit?: boolean
}
