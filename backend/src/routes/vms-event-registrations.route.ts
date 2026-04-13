import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  createEventRegistration,
  deleteEventRegistrationById,
  getEventRegistrationById,
  listEventRegistrations,
  updateEventRegistrationById,
} from '../repositories/vms-event-registrations.repository'
import {
  createEventRegistrationSchema,
  eventRegistrationParamsSchema,
  updateEventRegistrationSchema,
} from '../schemas/vms-event-registration.schema'
import type { AppBindings } from '../types/bindings'

export const vmsEventRegistrationsRoute = new Hono<{ Bindings: AppBindings }>()

vmsEventRegistrationsRoute.get('/event-registrations', async (c) => {
  try {
    const eventId = c.req.query('eventId')
    const eventRegistrations = await listEventRegistrations(c.env.VMS_DB, eventId)
    return c.json({ eventRegistrations })
  } catch (error) {
    console.error('Failed to list event registrations', error)
    return c.json({ error: 'Could not fetch event registrations.' }, 500)
  }
})

vmsEventRegistrationsRoute.get(
  '/event-registrations/:id',
  zValidator('param', eventRegistrationParamsSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const eventRegistration = await getEventRegistrationById(c.env.VMS_DB, id)

      if (!eventRegistration) {
        return c.json({ error: 'Event registration not found.' }, 404)
      }

      return c.json({ eventRegistration })
    } catch (error) {
      console.error('Failed to fetch event registration', error)
      return c.json({ error: 'Could not fetch event registration.' }, 500)
    }
  },
)

vmsEventRegistrationsRoute.post('/event-registrations', zValidator('json', createEventRegistrationSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const eventRegistrationId = crypto.randomUUID()
    const eventRegistration = await createEventRegistration(c.env.VMS_DB, eventRegistrationId, payload)

    return c.json({ eventRegistration }, 201)
  } catch (error) {
    console.error('Failed to create event registration', error)
    return c.json({ error: 'Could not create event registration.' }, 500)
  }
})

vmsEventRegistrationsRoute.put(
  '/event-registrations/:id',
  zValidator('param', eventRegistrationParamsSchema),
  zValidator('json', updateEventRegistrationSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const payload = c.req.valid('json')

      const existing = await getEventRegistrationById(c.env.VMS_DB, id)
      if (!existing) {
        return c.json({ error: 'Event registration not found.' }, 404)
      }

      const eventRegistration = await updateEventRegistrationById(c.env.VMS_DB, id, payload)
      return c.json({ eventRegistration })
    } catch (error) {
      console.error('Failed to update event registration', error)
      return c.json({ error: 'Could not update event registration.' }, 500)
    }
  },
)

vmsEventRegistrationsRoute.delete('/event-registrations/:id', zValidator('param', eventRegistrationParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const deleted = await deleteEventRegistrationById(c.env.VMS_DB, id)

    if (!deleted) {
      return c.json({ error: 'Event registration not found.' }, 404)
    }

    return c.json({ message: 'Event registration deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete event registration', error)
    return c.json({ error: 'Could not delete event registration.' }, 500)
  }
})

vmsEventRegistrationsRoute.post(
  '/event-registrations/:id/approve',
  zValidator('param', eventRegistrationParamsSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const approver = c.req.query('approver')

      if (!approver) {
        return c.json({ error: 'Approver membership number is required.' }, 400)
      }

      const existing = await getEventRegistrationById(c.env.VMS_DB, id)
      if (!existing) {
        return c.json({ error: 'Event registration not found.' }, 404)
      }

      const eventRegistration = await updateEventRegistrationById(c.env.VMS_DB, id, {
        attendanceApprovedBy: approver,
      })

      return c.json({ eventRegistration })
    } catch (error) {
      console.error('Failed to approve attendance', error)
      return c.json({ error: 'Could not approve attendance.' }, 500)
    }
  },
)
