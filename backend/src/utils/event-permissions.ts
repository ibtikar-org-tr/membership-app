import type { D1DatabaseLike } from '../types/bindings'
import { canManageProject } from './project-access'

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
  if (event.projectId) {
    const access = await canManageProject(db, event.projectId, membershipNumber)
    if (access.isAuthorized) {
      return true
    }
  }

  return event.createdBy === membershipNumber
}
