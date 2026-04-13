import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  createEventTicket,
  deleteEventTicketById,
  getEventTicketById,
  listEventTickets,
  updateEventTicketById,
} from '../repositories/vms-event-tickets.repository'
import { createEventTicketSchema, eventTicketParamsSchema, updateEventTicketSchema } from '../schemas/vms-event-ticket.schema'
import type { AppBindings } from '../types/bindings'

export const vmsEventTicketsRoute = new Hono<{ Bindings: AppBindings }>()

vmsEventTicketsRoute.get('/event-tickets', async (c) => {
  try {
    const eventId = c.req.query('eventId')
    const eventTickets = await listEventTickets(c.env.VMS_DB, eventId)
    return c.json({ eventTickets })
  } catch (error) {
    console.error('Failed to list event tickets', error)
    return c.json({ error: 'Could not fetch event tickets.' }, 500)
  }
})

vmsEventTicketsRoute.get('/event-tickets/:id', zValidator('param', eventTicketParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const eventTicket = await getEventTicketById(c.env.VMS_DB, id)

    if (!eventTicket) {
      return c.json({ error: 'Event ticket not found.' }, 404)
    }

    return c.json({ eventTicket })
  } catch (error) {
    console.error('Failed to fetch event ticket', error)
    return c.json({ error: 'Could not fetch event ticket.' }, 500)
  }
})

vmsEventTicketsRoute.post('/event-tickets', zValidator('json', createEventTicketSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const eventTicketId = crypto.randomUUID()
    const eventTicket = await createEventTicket(c.env.VMS_DB, eventTicketId, payload)

    return c.json({ eventTicket }, 201)
  } catch (error) {
    console.error('Failed to create event ticket', error)
    return c.json({ error: 'Could not create event ticket.' }, 500)
  }
})

vmsEventTicketsRoute.put(
  '/event-tickets/:id',
  zValidator('param', eventTicketParamsSchema),
  zValidator('json', updateEventTicketSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const payload = c.req.valid('json')

      const existing = await getEventTicketById(c.env.VMS_DB, id)
      if (!existing) {
        return c.json({ error: 'Event ticket not found.' }, 404)
      }

      const eventTicket = await updateEventTicketById(c.env.VMS_DB, id, payload)
      return c.json({ eventTicket })
    } catch (error) {
      console.error('Failed to update event ticket', error)
      return c.json({ error: 'Could not update event ticket.' }, 500)
    }
  },
)

vmsEventTicketsRoute.delete('/event-tickets/:id', zValidator('param', eventTicketParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const deleted = await deleteEventTicketById(c.env.VMS_DB, id)

    if (!deleted) {
      return c.json({ error: 'Event ticket not found.' }, 404)
    }

    return c.json({ message: 'Event ticket deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete event ticket', error)
    return c.json({ error: 'Could not delete event ticket.' }, 500)
  }
})
