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
