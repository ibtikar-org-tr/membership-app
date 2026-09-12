import { getProjectById, type ProjectRecord } from '../repositories/vms-projects.repository'
import { getProjectMember } from '../repositories/vms-project-members.repository'
import type { ProjectMemberRole } from '../schemas/vms-project-member.schema'
import type { D1DatabaseLike } from '../types/bindings'

export type ProjectAccessResult = {
  project: ProjectRecord | null
  isMember: boolean
  canManage: boolean
  canEdit: boolean
  role: ProjectMemberRole | null
}

/**
 * Effective role for a person on a project.
 * projects.owner remains the canonical owner pointer; member row is preferred when present.
 */
export function getEffectiveRole(
  project: Pick<ProjectRecord, 'owner'>,
  membershipNumber: string,
  memberRole: string | null | undefined,
): ProjectMemberRole | null {
  if (project.owner === membershipNumber) {
    return 'owner'
  }

  if (memberRole === 'owner' || memberRole === 'member' || memberRole === 'manager' || memberRole === 'observer') {
    return memberRole
  }

  return null
}

export async function getProjectAccess(
  db: D1DatabaseLike,
  projectId: string,
  membershipNumber: string,
): Promise<ProjectAccessResult> {
  const project = await getProjectById(db, projectId)

  if (!project) {
    return {
      project: null,
      isMember: false,
      canManage: false,
      canEdit: false,
      role: null,
    }
  }

  const member = await getProjectMember(db, projectId, membershipNumber)
  const role = getEffectiveRole(project, membershipNumber, member?.role)

  // Safety net during rollout: owner column still grants membership if the row is missing.
  const isMember = Boolean(role) || project.owner === membershipNumber
  const effectiveRole: ProjectMemberRole | null =
    role ?? (project.owner === membershipNumber ? 'owner' : null)

  return {
    project,
    isMember,
    canManage: effectiveRole === 'owner' || effectiveRole === 'manager',
    canEdit: effectiveRole === 'owner' || effectiveRole === 'manager' || effectiveRole === 'member',
    role: effectiveRole,
  }
}

export async function isProjectMember(db: D1DatabaseLike, projectId: string, membershipNumber: string) {
  const access = await getProjectAccess(db, projectId, membershipNumber)
  return {
    project: access.project,
    isMember: access.isMember,
    role: access.role,
  }
}

export async function canManageProject(db: D1DatabaseLike, projectId: string, membershipNumber: string) {
  const access = await getProjectAccess(db, projectId, membershipNumber)
  return {
    project: access.project,
    isAuthorized: access.canManage,
    role: access.role,
  }
}
