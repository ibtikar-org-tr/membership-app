import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getUserByMembershipNumber } from '../repositories/users.repository'
import {
  createProject,
  deleteProjectById,
  getDirectProjectByIdForMember,
  getProjectById,
  listDirectProjectsForMember,
  listProjectsForMember,
  listProjectsForMemberWithRedactedNames,
  updateProjectById,
} from '../repositories/vms-projects.repository'
import { getProjectMember } from '../repositories/vms-project-members.repository'
import { createProjectSchema, projectParamsSchema, updateProjectSchema } from '../schemas/vms-project.schema'
import type { AppBindings } from '../types/bindings'

export const vmsProjectsRoute = new Hono<{ Bindings: AppBindings }>()

async function canManageProject(db: AppBindings['VMS_DB'], projectId: string, membershipNumber: string) {
  const project = await getProjectById(db, projectId)

  if (!project) {
    return { project: null, isAuthorized: false }
  }

  if (project.owner === membershipNumber) {
    return { project, isAuthorized: true }
  }

  const membership = await getProjectMember(db, projectId, membershipNumber)
  return { project, isAuthorized: membership?.role === 'manager' }
}

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

vmsProjectsRoute.get('/projects/direct', async (c) => {
  try {
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const projects = await listDirectProjectsForMember(c.env.VMS_DB, membershipNumber)
    return c.json({ projects })
  } catch (error) {
    console.error('Failed to list direct projects', error)
    return c.json({ error: 'Could not fetch direct projects.' }, 500)
  }
})

vmsProjectsRoute.get('/projects/platform', async (c) => {
  try {
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const projects = await listProjectsForMemberWithRedactedNames(c.env.VMS_DB, membershipNumber)
    return c.json({ projects })
  } catch (error) {
    console.error('Failed to list platform projects', error)
    return c.json({ error: 'Could not fetch platform projects.' }, 500)
  }
})

vmsProjectsRoute.get('/projects/:id', zValidator('param', projectParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const project = await getDirectProjectByIdForMember(c.env.VMS_DB, id, membershipNumber)

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
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const payload = c.req.valid('json')

    if (payload.owner.trim() !== membershipNumber) {
      return c.json({ error: 'يجب أن يطابق المالك رقم عضويتك.' }, 403)
    }

    const actor = await getUserByMembershipNumber(c.env.MEMBERS_DB, membershipNumber)

    if (!actor) {
      return c.json({ error: 'Could not create project.' }, 404)
    }

    const parentId = payload.parentProjectId?.trim()
    const isAdmin = actor.role.trim().toLowerCase() === 'admin'

    if (!parentId) {
      if (!isAdmin) {
        return c.json({ error: 'يُسمح للمسؤولين فقط بإنشاء مشاريع رئيسية (بدون مشروع أب).' }, 403)
      }
    } else {
      const parent = await getProjectById(c.env.VMS_DB, parentId)

      if (!parent) {
        return c.json({ error: 'المشروع الأب غير موجود.' }, 404)
      }

      const isParentOwner = parent.owner === membershipNumber
      const membership = await getProjectMember(c.env.VMS_DB, parentId, membershipNumber)
      const isParentManager = membership?.role === 'manager'

      if (!isAdmin && !isParentOwner && !isParentManager) {
        return c.json({ error: 'يُسمح لمالك المشروع أو المدراء فقط بإضافة مشاريع فرعية.' }, 403)
      }
    }

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
      const membershipNumber = c.req.query('membershipNumber')?.trim()

      if (!membershipNumber) {
        return c.json({ error: 'Membership number is required.' }, 400)
      }

      const payload = c.req.valid('json')
      const authorization = await canManageProject(c.env.VMS_DB, id, membershipNumber)
      if (!authorization.project) {
        return c.json({ error: 'Project not found.' }, 404)
      }

      if (!authorization.isAuthorized) {
        return c.json({ error: 'Only project owner or managers can update project settings.' }, 403)
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
