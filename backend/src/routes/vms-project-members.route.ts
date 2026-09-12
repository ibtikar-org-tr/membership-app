import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  getMemberContactInfoByMembershipNumber,
  getUserDisplayNamesByMembershipNumbers,
} from '../repositories/user-info.repository'
import { getProjectById } from '../repositories/vms-projects.repository'
import {
  deleteProjectMember,
  getProjectMember,
  listProjectMembers,
  updateProjectMember,
} from '../repositories/vms-project-members.repository'
import {
  createProjectMemberSchema,
  projectMemberParamsSchema,
  updateProjectMemberSchema,
} from '../schemas/vms-project-member.schema'
import { notifyProjectMemberRemoved } from '../services/project-member-notification.service'
import type { AppBindings } from '../types/bindings'
import type { AppEnv } from '../types/hono'
import { getActorMembershipNumber } from '../utils/actor'
import { canManageProject, getEffectiveRole, isProjectMember } from '../utils/project-access'

export const vmsProjectMembersRoute = new Hono<AppEnv>()

async function enrichProjectMembersWithDisplayNames(
  membersDb: AppBindings['MEMBERS_DB'],
  projectMembers: Array<{ projectId: string; membershipNumber: string; role: string; displayName: string }>,
) {
  const displayNameMap = await getUserDisplayNamesByMembershipNumbers(
    membersDb,
    projectMembers.map((member) => member.membershipNumber),
  )

  return projectMembers.map((member) => ({
    ...member,
    displayName: displayNameMap.get(member.membershipNumber) ?? member.displayName ?? member.membershipNumber,
  }))
}

vmsProjectMembersRoute.get('/project-members', async (c) => {
  try {
    const projectId = c.req.query('projectId')
    const projectMembers = await listProjectMembers(c.env.VMS_DB, projectId)

    if (projectId) {
      const project = await getProjectById(c.env.VMS_DB, projectId)
      if (project) {
        const hasOwnerRow = projectMembers.some(
          (member) => member.membershipNumber === project.owner || member.role === 'owner',
        )

        if (!hasOwnerRow) {
          projectMembers.unshift({
            projectId,
            membershipNumber: project.owner,
            role: 'owner',
            displayName: project.owner,
          })
        } else {
          for (const member of projectMembers) {
            member.role = getEffectiveRole(project, member.membershipNumber, member.role) ?? member.role
          }
        }
      }
    }

    const enriched = await enrichProjectMembersWithDisplayNames(c.env.MEMBERS_DB, projectMembers)
    return c.json({ projectMembers: enriched })
  } catch (error) {
    console.error('Failed to list project members', error)
    return c.json({ error: 'Could not fetch project members.' }, 500)
  }
})

vmsProjectMembersRoute.get(
  '/project-members/:projectId/:membershipNumber/contact',
  zValidator('param', projectMemberParamsSchema),
  async (c) => {
    try {
      const { projectId, membershipNumber } = c.req.valid('param')
      const actorMembershipNumber = getActorMembershipNumber(c)

      const actorAccess = await isProjectMember(c.env.VMS_DB, projectId, actorMembershipNumber)
      if (!actorAccess.project) {
        return c.json({ error: 'Project not found.' }, 404)
      }
      if (!actorAccess.isMember) {
        return c.json({ error: 'Only project members can view member contact info.' }, 403)
      }

      const targetAccess = await isProjectMember(c.env.VMS_DB, projectId, membershipNumber)
      if (!targetAccess.isMember) {
        return c.json({ error: 'Project member not found.' }, 404)
      }

      const contact = await getMemberContactInfoByMembershipNumber(c.env.MEMBERS_DB, membershipNumber)
      if (!contact) {
        return c.json({ error: 'Member contact info not found.' }, 404)
      }

      return c.json({ contact })
    } catch (error) {
      console.error('Failed to fetch project member contact info', error)
      return c.json({ error: 'Could not fetch project member contact info.' }, 500)
    }
  },
)

vmsProjectMembersRoute.get(
  '/project-members/:projectId/:membershipNumber',
  zValidator('param', projectMemberParamsSchema),
  async (c) => {
    try {
      const { projectId, membershipNumber } = c.req.valid('param')
      const access = await isProjectMember(c.env.VMS_DB, projectId, membershipNumber)

      if (!access.project) {
        return c.json({ error: 'Project not found.' }, 404)
      }

      if (!access.isMember || !access.role) {
        return c.json({ error: 'Project member not found.' }, 404)
      }

      const projectMember = await getProjectMember(c.env.VMS_DB, projectId, membershipNumber)
      const member = projectMember
        ? {
            ...projectMember,
            role: getEffectiveRole(access.project, membershipNumber, projectMember.role) ?? projectMember.role,
          }
        : {
            projectId,
            membershipNumber,
            role: access.role,
            displayName: membershipNumber,
          }

      const enriched = await enrichProjectMembersWithDisplayNames(c.env.MEMBERS_DB, [member])
      return c.json({ projectMember: enriched[0] })
    } catch (error) {
      console.error('Failed to fetch project member', error)
      return c.json({ error: 'Could not fetch project member.' }, 500)
    }
  },
)

vmsProjectMembersRoute.post('/project-members', zValidator('json', createProjectMemberSchema), async (c) => {
  try {
    return c.json({ error: 'Use volunteering positions and applications to add project members.' }, 403)
  } catch (error) {
    console.error('Failed to create project member', error)
    return c.json({ error: 'Could not create project member.' }, 500)
  }
})

vmsProjectMembersRoute.put(
  '/project-members/:projectId/:membershipNumber',
  zValidator('param', projectMemberParamsSchema),
  zValidator('json', updateProjectMemberSchema),
  async (c) => {
    try {
      const { projectId, membershipNumber } = c.req.valid('param')
      const actorMembershipNumber = getActorMembershipNumber(c)
      const payload = c.req.valid('json')

      const project = await getProjectById(c.env.VMS_DB, projectId)

      if (!project) {
        return c.json({ error: 'Project not found.' }, 404)
      }

      if (membershipNumber === project.owner) {
        return c.json(
          {
            error: 'لا يمكن تغيير دور مالك المشروع من هنا. انقل الملكية عبر إعدادات المشروع.',
          },
          403,
        )
      }

      if (payload.role !== undefined) {
        if (project.owner !== actorMembershipNumber) {
          return c.json({ error: 'فقط مالك المشروع يمكنه تغيير أدوار الأعضاء.' }, 403)
        }

        if (payload.role !== 'member' && payload.role !== 'manager') {
          return c.json({ error: 'يمكن ترقية الأعضاء إلى مدير أو إرجاعهم إلى عضو فقط.' }, 400)
        }
      } else {
        const authorization = await canManageProject(c.env.VMS_DB, projectId, actorMembershipNumber)

        if (!authorization.isAuthorized) {
          return c.json({ error: 'Only project owner or managers can update project members.' }, 403)
        }
      }

      const existing = await getProjectMember(c.env.VMS_DB, projectId, membershipNumber)
      if (!existing) {
        return c.json({ error: 'Project member not found.' }, 404)
      }

      if (existing.role === 'owner') {
        return c.json(
          {
            error: 'لا يمكن تغيير دور مالك المشروع من هنا. انقل الملكية عبر إعدادات المشروع.',
          },
          403,
        )
      }

      const projectMember = await updateProjectMember(c.env.VMS_DB, projectId, membershipNumber, payload)

      if (!projectMember) {
        return c.json({ error: 'Project member not found.' }, 404)
      }

      const enriched = await enrichProjectMembersWithDisplayNames(c.env.MEMBERS_DB, [projectMember])
      return c.json({ projectMember: enriched[0] })
    } catch (error) {
      console.error('Failed to update project member', error)
      return c.json({ error: 'Could not update project member.' }, 500)
    }
  },
)

vmsProjectMembersRoute.delete(
  '/project-members/:projectId/:membershipNumber',
  zValidator('param', projectMemberParamsSchema),
  async (c) => {
    try {
      const { projectId, membershipNumber } = c.req.valid('param')
      const actorMembershipNumber = getActorMembershipNumber(c)

      const project = await getProjectById(c.env.VMS_DB, projectId)

      if (!project) {
        return c.json({ error: 'Project not found.' }, 404)
      }

      if (project.owner === membershipNumber) {
        return c.json(
          {
            error:
              'لا يمكن إزالة مالك المشروع. انقل الملكية إلى عضو آخر أولاً إذا أردت مغادرة المشروع.',
          },
          403,
        )
      }

      const isSelfLeave = actorMembershipNumber === membershipNumber

      if (!isSelfLeave) {
        const authorization = await canManageProject(c.env.VMS_DB, projectId, actorMembershipNumber)

        if (!authorization.isAuthorized) {
          return c.json({ error: 'فقط مالك المشروع أو المدراء يمكنهم إزالة الأعضاء.' }, 403)
        }
      }

      const existingMember = await getProjectMember(c.env.VMS_DB, projectId, membershipNumber)

      if (!existingMember) {
        return c.json({ error: 'Project member not found.' }, 404)
      }

      if (existingMember.role === 'owner') {
        return c.json(
          {
            error:
              'لا يمكن إزالة مالك المشروع. انقل الملكية إلى عضو آخر أولاً إذا أردت مغادرة المشروع.',
          },
          403,
        )
      }

      const deleted = await deleteProjectMember(c.env.VMS_DB, projectId, membershipNumber)

      if (!deleted) {
        return c.json({ error: 'Project member not found.' }, 404)
      }

      const displayNameMap = await getUserDisplayNamesByMembershipNumbers(c.env.MEMBERS_DB, [
        membershipNumber,
        actorMembershipNumber,
      ])

      await notifyProjectMemberRemoved(c.env, {
        frontendBaseUrl: c.env.FRONTEND_BASE_URL,
        projectId,
        projectName: project.name,
        actorMembershipNumber,
        removedMembershipNumber: membershipNumber,
        actorDisplayName: displayNameMap.get(actorMembershipNumber) ?? actorMembershipNumber,
        removedDisplayName: displayNameMap.get(membershipNumber) ?? membershipNumber,
        isSelfLeave,
        projectOwnerMembershipNumber: project.owner,
      })

      return c.json({ message: 'Project member deleted successfully.' })
    } catch (error) {
      console.error('Failed to delete project member', error)
      return c.json({ error: 'Could not delete project member.' }, 500)
    }
  },
)
