import { getProjectMember } from '../repositories/vms-project-members.repository'
import type { D1DatabaseLike } from '../types/bindings'

type EventManagementContext = {
  createdBy: string
  projectId: string | null
  projectOwner: string | null
}

export async function canManageEvent(
  db: D1DatabaseLike,
  event: EventManagementContext,
  membershipNumber: string,
): Promise<boolean> {
  if (event.projectId && event.projectOwner === membershipNumber) {
    return true
  }

  if (event.projectId) {
    const projectMember = await getProjectMember(db, event.projectId, membershipNumber)
    if (projectMember?.role === 'manager') {
      return true
    }
  }

  return event.createdBy === membershipNumber
}
