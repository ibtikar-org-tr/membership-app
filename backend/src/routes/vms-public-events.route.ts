import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getUserByEmail } from '../repositories/users.repository'
import {
  createEventRegistration,
  getEventRegistrationByEventAndGuestEmail,
} from '../repositories/vms-event-registrations.repository'
import { getEventTicketById, listEventTickets } from '../repositories/vms-event-tickets.repository'
import { getEventById } from '../repositories/vms-events.repository'
import { createGuestEventRegistrationSchema } from '../schemas/vms-event-registration.schema'
import { eventParamsSchema } from '../schemas/vms-event.schema'
import type { AppBindings } from '../types/bindings'
import { stripTicketActiveRegistrationCounts } from '../utils/event-registration-counts'

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
    const visibleTickets =
      event.displayAttendeeNumbers === false
        ? stripTicketActiveRegistrationCounts(eventTickets)
        : eventTickets

    return c.json({ eventTickets: visibleTickets })
  } catch (error) {
    console.error('Failed to fetch public event tickets', error)
    return c.json({ error: 'Could not fetch event tickets.' }, 500)
  }
})

vmsPublicEventsRoute.post(
  '/public/events/:id/registrations',
  zValidator('param', eventParamsSchema),
  zValidator('json', createGuestEventRegistrationSchema),
  async (c) => {
    try {
      const { id: eventId } = c.req.valid('param')
      const payload = c.req.valid('json')

      const event = await getEventById(c.env.VMS_DB, eventId)
      if (!event || event.status !== 'public') {
        return c.json({ error: 'Event not found.' }, 404)
      }

      if (!event.allowGuestRegistration) {
        return c.json({ error: 'التسجيل في هذه الفعالية متاح للأعضاء فقط. يرجى تسجيل الدخول.' }, 403)
      }

      const existingUser = await getUserByEmail(c.env.MEMBERS_DB, payload.guestEmail)
      if (existingUser) {
        return c.json({ error: 'هذا البريد مرتبط بحساب. يرجى تسجيل الدخول للتقديم.' }, 409)
      }

      const existingGuestRegistration = await getEventRegistrationByEventAndGuestEmail(
        c.env.VMS_DB,
        eventId,
        payload.guestEmail,
      )
      if (existingGuestRegistration) {
        return c.json({ error: 'هذا البريد مسجّل مسبقاً في هذه الفعالية.' }, 409)
      }

      const ticket = await getEventTicketById(c.env.VMS_DB, payload.ticketId)
      if (!ticket || ticket.eventId !== eventId) {
        return c.json({ error: 'التذكرة المختارة غير متاحة لهذه الفعالية.' }, 400)
      }

      if (ticket.activeRegistrationCount >= ticket.quantity) {
        return c.json({ error: 'لم يعد هناك مقاعد متاحة لهذه التذكرة.' }, 409)
      }

      const eventRegistration = await createEventRegistration(c.env.VMS_DB, crypto.randomUUID(), {
        eventId,
        membershipNumber: null,
        ticketId: payload.ticketId,
        status: 'registered',
        guestEmail: payload.guestEmail,
        guestName: payload.guestName,
        guestPhone: payload.guestPhone,
      })

      return c.json(
        {
          eventRegistration: {
            ...eventRegistration,
            displayName: eventRegistration.guestName ?? payload.guestName,
          },
        },
        201,
      )
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('UNIQUE constraint failed') &&
        (error.message.includes('guest_email') || error.message.includes('idx_event_registrations_event_guest_email'))
      ) {
        return c.json({ error: 'هذا البريد مسجّل مسبقاً في هذه الفعالية.' }, 409)
      }

      console.error('Failed to create guest event registration', error)
      return c.json({ error: 'Could not create event registration.' }, 500)
    }
  },
)
