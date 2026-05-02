import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { createEvent, deleteEventById, getEventById, listEvents, updateEventById } from '../repositories/vms-events.repository'
import { getProjectMember } from '../repositories/vms-project-members.repository'
import { getProjectById } from '../repositories/vms-projects.repository'
import { createEventSchema, eventParamsSchema, updateEventSchema } from '../schemas/vms-event.schema'
import type { AppBindings } from '../types/bindings'

export const vmsEventsRoute = new Hono<{ Bindings: AppBindings }>()

vmsEventsRoute.get('/events', async (c) => {
  try {
    const events = await listEvents(c.env.VMS_DB)
    return c.json({ events })
  } catch (error) {
    console.error('Failed to list events', error)
    return c.json({ error: 'Could not fetch events.' }, 500)
  }
})

vmsEventsRoute.get('/events/:id', zValidator('param', eventParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const event = await getEventById(c.env.VMS_DB, id)

    if (!event) {
      return c.json({ error: 'Event not found.' }, 404)
    }

    return c.json({ event })
  } catch (error) {
    console.error('Failed to fetch event', error)
    return c.json({ error: 'Could not fetch event.' }, 500)
  }
})

vmsEventsRoute.post('/events', zValidator('json', createEventSchema), async (c) => {
  try {
    const payload = c.req.valid('json')

    const project = await getProjectById(c.env.VMS_DB, payload.projectId)
    if (!project) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    const isOwner = project.owner === payload.createdBy
    const projectMember = await getProjectMember(c.env.VMS_DB, payload.projectId, payload.createdBy)
    const isManager = projectMember?.role === 'manager'

    if (!isOwner && !isManager) {
      return c.json({ error: 'Only project owner or managers can create events for this project.' }, 403)
    }

    const eventId = crypto.randomUUID()
    const event = await createEvent(c.env.VMS_DB, eventId, payload)

    return c.json({ event }, 201)
  } catch (error) {
    console.error('Failed to create event', error)
    return c.json({ error: 'Could not create event.' }, 500)
  }
})

vmsEventsRoute.put(
  '/events/:id',
  zValidator('param', eventParamsSchema),
  zValidator('json', updateEventSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const payload = c.req.valid('json')

      const existing = await getEventById(c.env.VMS_DB, id)
      if (!existing) {
        return c.json({ error: 'Event not found.' }, 404)
      }

      const event = await updateEventById(c.env.VMS_DB, id, payload)
      return c.json({ event })
    } catch (error) {
      console.error('Failed to update event', error)
      return c.json({ error: 'Could not update event.' }, 500)
    }
  },
)

vmsEventsRoute.delete('/events/:id', zValidator('param', eventParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const deleted = await deleteEventById(c.env.VMS_DB, id)

    if (!deleted) {
      return c.json({ error: 'Event not found.' }, 404)
    }

    return c.json({ message: 'Event deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete event', error)
    return c.json({ error: 'Could not delete event.' }, 500)
  }
})
