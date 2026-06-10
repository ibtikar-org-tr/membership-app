import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getEventById } from '../repositories/vms-events.repository'
import { listEventTickets } from '../repositories/vms-event-tickets.repository'
import { eventParamsSchema } from '../schemas/vms-event.schema'
import type { AppBindings } from '../types/bindings'

export const vmsPublicEventsRoute = new Hono<{ Bindings: AppBindings }>()

vmsPublicEventsRoute.get('/public/events/:id', zValidator('param', eventParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const event = await getEventById(c.env.VMS_DB, id)

    if (!event || event.status !== 'public') {
      return c.json({ error: 'Event not found.' }, 404)
    }

    return c.json({ event })
  } catch (error) {
    console.error('Failed to fetch public event', error)
    return c.json({ error: 'Could not fetch event.' }, 500)
  }
})

vmsPublicEventsRoute.get('/public/events/:id/tickets', zValidator('param', eventParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const event = await getEventById(c.env.VMS_DB, id)

    if (!event || event.status !== 'public') {
      return c.json({ error: 'Event not found.' }, 404)
    }

    const eventTickets = await listEventTickets(c.env.VMS_DB, id)
    return c.json({ eventTickets })
  } catch (error) {
    console.error('Failed to fetch public event tickets', error)
    return c.json({ error: 'Could not fetch event tickets.' }, 500)
  }
})
