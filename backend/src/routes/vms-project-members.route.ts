import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
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

vmsProjectMembersRoute.get('/project-members', async (c) => {
  try {
    const projectId = c.req.query('projectId')
    const projectMembers = await listProjectMembers(c.env.VMS_DB, projectId)
    return c.json({ projectMembers })
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

      return c.json({ projectMember })
    } catch (error) {
      console.error('Failed to fetch project member', error)
      return c.json({ error: 'Could not fetch project member.' }, 500)
    }
  },
)

vmsProjectMembersRoute.post('/project-members', zValidator('json', createProjectMemberSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const projectMember = await createProjectMember(c.env.VMS_DB, payload)

    return c.json({ projectMember }, 201)
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
      const payload = c.req.valid('json')

      const existing = await getProjectMember(c.env.VMS_DB, projectId, membershipNumber)
      if (!existing) {
        return c.json({ error: 'Project member not found.' }, 404)
      }

      const projectMember = await updateProjectMember(c.env.VMS_DB, projectId, membershipNumber, payload)
      return c.json({ projectMember })
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
