import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getUserDisplayNamesByMembershipNumbers } from '../repositories/user-info.repository'
import { getProjectById } from '../repositories/vms-projects.repository'
import {
  createProjectMember,
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
import type { AppBindings } from '../types/bindings'

export const vmsProjectMembersRoute = new Hono<{ Bindings: AppBindings }>()

async function canManageProjectMembers(db: AppBindings['VMS_DB'], projectId: string, membershipNumber: string) {
  const project = await getProjectById(db, projectId)

  if (!project) {
    return { project: null, isAuthorized: false }
  }

  if (project.owner === membershipNumber) {
    return { project, isAuthorized: true }
  }

  const projectMember = await getProjectMember(db, projectId, membershipNumber)
  return {
    project,
    isAuthorized: projectMember?.role === 'manager',
  }
}

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
    const enriched = await enrichProjectMembersWithDisplayNames(c.env.MEMBERS_DB, projectMembers)
    return c.json({ projectMembers: enriched })
  } catch (error) {
    console.error('Failed to list project members', error)
    return c.json({ error: 'Could not fetch project members.' }, 500)
  }
})

vmsProjectMembersRoute.get(
  '/project-members/:projectId/:membershipNumber',
  zValidator('param', projectMemberParamsSchema),
  async (c) => {
    try {
      const { projectId, membershipNumber } = c.req.valid('param')
      const projectMember = await getProjectMember(c.env.VMS_DB, projectId, membershipNumber)

      if (!projectMember) {
        return c.json({ error: 'Project member not found.' }, 404)
      }

      const enriched = await enrichProjectMembersWithDisplayNames(c.env.MEMBERS_DB, [projectMember])
      return c.json({ projectMember: enriched[0] })
    } catch (error) {
      console.error('Failed to fetch project member', error)
      return c.json({ error: 'Could not fetch project member.' }, 500)
    }
  },
)

vmsProjectMembersRoute.post('/project-members', zValidator('json', createProjectMemberSchema), async (c) => {
  try {
    const actorMembershipNumber = c.req.query('membershipNumber')?.trim()

    if (!actorMembershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const payload = c.req.valid('json')
    const authorization = await canManageProjectMembers(c.env.VMS_DB, payload.projectId, actorMembershipNumber)

    if (!authorization.project) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    if (!authorization.isAuthorized) {
      return c.json({ error: 'Only project owner or managers can add project members.' }, 403)
    }

    const projectMember = await createProjectMember(c.env.VMS_DB, payload)

    if (!projectMember) {
      return c.json({ error: 'Could not create project member.' }, 500)
    }

    const enriched = await enrichProjectMembersWithDisplayNames(c.env.MEMBERS_DB, [projectMember])

    return c.json({ projectMember: enriched[0] }, 201)
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
      const actorMembershipNumber = c.req.query('membershipNumber')?.trim()

      if (!actorMembershipNumber) {
        return c.json({ error: 'Membership number is required.' }, 400)
      }

      const payload = c.req.valid('json')
      const authorization = await canManageProjectMembers(c.env.VMS_DB, projectId, actorMembershipNumber)

      if (!authorization.project) {
        return c.json({ error: 'Project not found.' }, 404)
      }

      if (!authorization.isAuthorized) {
        return c.json({ error: 'Only project owner or managers can update project members.' }, 403)
      }

      const existing = await getProjectMember(c.env.VMS_DB, projectId, membershipNumber)
      if (!existing) {
        return c.json({ error: 'Project member not found.' }, 404)
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
      const deleted = await deleteProjectMember(c.env.VMS_DB, projectId, membershipNumber)

      if (!deleted) {
        return c.json({ error: 'Project member not found.' }, 404)
      }

      return c.json({ message: 'Project member deleted successfully.' })
    } catch (error) {
      console.error('Failed to delete project member', error)
      return c.json({ error: 'Could not delete project member.' }, 500)
    }
  },
)
