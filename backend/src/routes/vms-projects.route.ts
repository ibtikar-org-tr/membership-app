import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  createProject,
  deleteProjectById,
  getProjectById,
  getProjectByIdForMember,
  listProjectsForMember,
  updateProjectById,
} from '../repositories/vms-projects.repository'
import { createProjectSchema, projectParamsSchema, updateProjectSchema } from '../schemas/vms-project.schema'
import type { AppBindings } from '../types/bindings'

export const vmsProjectsRoute = new Hono<{ Bindings: AppBindings }>()

vmsProjectsRoute.get('/projects', async (c) => {
  try {
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const projects = await listProjectsForMember(c.env.VMS_DB, membershipNumber)
    return c.json({ projects })
  } catch (error) {
    console.error('Failed to list projects', error)
    return c.json({ error: 'Could not fetch projects.' }, 500)
  }
})

vmsProjectsRoute.get('/projects/:id', zValidator('param', projectParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const project = await getProjectByIdForMember(c.env.VMS_DB, id, membershipNumber)

    if (!project) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    return c.json({ project })
  } catch (error) {
    console.error('Failed to fetch project', error)
    return c.json({ error: 'Could not fetch project.' }, 500)
  }
})

vmsProjectsRoute.post('/projects', zValidator('json', createProjectSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const projectId = crypto.randomUUID()
    const project = await createProject(c.env.VMS_DB, projectId, payload)

    return c.json({ project }, 201)
  } catch (error) {
    console.error('Failed to create project', error)
    return c.json({ error: 'Could not create project.' }, 500)
  }
})

vmsProjectsRoute.put(
  '/projects/:id',
  zValidator('param', projectParamsSchema),
  zValidator('json', updateProjectSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const payload = c.req.valid('json')

      const existing = await getProjectById(c.env.VMS_DB, id)
      if (!existing) {
        return c.json({ error: 'Project not found.' }, 404)
      }

      const project = await updateProjectById(c.env.VMS_DB, id, payload)
      return c.json({ project })
    } catch (error) {
      console.error('Failed to update project', error)
      return c.json({ error: 'Could not update project.' }, 500)
    }
  },
)

vmsProjectsRoute.delete('/projects/:id', zValidator('param', projectParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const deleted = await deleteProjectById(c.env.VMS_DB, id)

    if (!deleted) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    return c.json({ message: 'Project deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete project', error)
    return c.json({ error: 'Could not delete project.' }, 500)
  }
})
