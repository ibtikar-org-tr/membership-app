import { colorForMembershipNumber } from '../../../utils/collaborator-color'
import type { VmsProject, VmsProjectMember } from '../../../types/vms'

export interface MentionableMember {
  id: string
  label: string
  color: string
  role?: string
}

export function buildMentionableMembers(
  project: VmsProject | null,
  projectMembers: VmsProjectMember[],
): MentionableMember[] {
  const byNumber = new Map<string, MentionableMember>()

  for (const member of projectMembers) {
    byNumber.set(member.membershipNumber, {
      id: member.membershipNumber,
      label: member.displayName?.trim() || member.membershipNumber,
      color: colorForMembershipNumber(member.membershipNumber),
      role: member.role,
    })
  }

  if (project?.owner && !byNumber.has(project.owner)) {
    byNumber.set(project.owner, {
      id: project.owner,
      label: project.owner,
      color: colorForMembershipNumber(project.owner),
      role: 'owner',
    })
  }

  return [...byNumber.values()].sort((left, right) => left.label.localeCompare(right.label, 'ar'))
}

export function filterMentionableMembers(members: MentionableMember[], query: string, limit = 8) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return members.slice(0, limit)
  }

  return members
    .filter((member) => {
      const label = member.label.toLowerCase()
      return label.includes(normalizedQuery) || member.id.includes(normalizedQuery)
    })
    .slice(0, limit)
}
