import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  createEventRegistration,
  deleteEventRegistrationById,
  getEventRegistrationById,
  getEventRegistrationByEventAndMember,
  listEventRegistrations,
  updateEventRegistrationById,
} from '../repositories/vms-event-registrations.repository'
import { getEventTicketById } from '../repositories/vms-event-tickets.repository'
import { getEventById } from '../repositories/vms-events.repository'
import { getUserDisplayNamesByMembershipNumbers } from '../repositories/user-info.repository'
import {
  createEventRegistrationSchema,
  eventRegistrationParamsSchema,
  updateEventRegistrationSchema,
} from '../schemas/vms-event-registration.schema'
import type { AppBindings } from '../types/bindings'
import type { AppEnv } from '../types/hono'
import { getActorMembershipNumber } from '../utils/actor'
import { canManageEvent } from '../utils/event-permissions'
import {
  canSelfCancelRegistration,
  countActiveRegistrationsForTicket,
} from '../utils/event-registration-cancellation'

export const vmsEventRegistrationsRoute = new Hono<AppEnv>()

async function enrichEventRegistrationsWithDisplayNames<T extends { membershipNumber: string }>(
  membersDb: AppBindings['MEMBERS_DB'],
  eventRegistrations: T[],
) {
  const displayNameMap = await getUserDisplayNamesByMembershipNumbers(
    membersDb,
    eventRegistrations.map((registration) => registration.membershipNumber),
  )

  return eventRegistrations.map((registration) => ({
    ...registration,
    displayName: displayNameMap.get(registration.membershipNumber) ?? registration.membershipNumber,
  }))
}

vmsEventRegistrationsRoute.get('/event-registrations', async (c) => {
  try {
    const eventId = c.req.query('eventId')
    let eventRegistrations = await listEventRegistrations(c.env.VMS_DB, eventId)

    if (eventId) {
      const event = await getEventById(c.env.VMS_DB, eventId)
      const actorMembershipNumber = getActorMembershipNumber(c)

      if (event && event.displayAttendeeNumbers === false) {
        const canManage = await canManageEvent(c.env.VMS_DB, event, actorMembershipNumber)
        if (!canManage) {
          eventRegistrations = eventRegistrations.filter(
            (registration) => registration.membershipNumber === actorMembershipNumber,
          )
        }
      }
    }

    const enrichedRegistrations = await enrichEventRegistrationsWithDisplayNames(
      c.env.MEMBERS_DB,
      eventRegistrations,
    )
    return c.json({ eventRegistrations: enrichedRegistrations })
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

      const [enrichedRegistration] = await enrichEventRegistrationsWithDisplayNames(c.env.MEMBERS_DB, [
        eventRegistration,
      ])

      return c.json({ eventRegistration: enrichedRegistration })
    } catch (error) {
      console.error('Failed to fetch event registration', error)
      return c.json({ error: 'Could not fetch event registration.' }, 500)
    }
  },
)

vmsEventRegistrationsRoute.post('/event-registrations', zValidator('json', createEventRegistrationSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const actorMembershipNumber = getActorMembershipNumber(c)

    if (payload.membershipNumber !== actorMembershipNumber) {
      return c.json({ error: 'يمكنك التسجيل في الفعالية لحسابك فقط.' }, 403)
    }

    const event = await getEventById(c.env.VMS_DB, payload.eventId)
    if (!event) {
      return c.json({ error: 'Event not found.' }, 404)
    }

    if (event.status !== 'public') {
      return c.json({ error: 'التسجيل متاح فقط للفعاليات المنشورة.' }, 403)
    }

    const existingRegistration = await getEventRegistrationByEventAndMember(
      c.env.VMS_DB,
      payload.eventId,
      actorMembershipNumber,
    )
    if (existingRegistration) {
      return c.json({ error: 'لديك تسجيل سابق في هذه الفعالية.' }, 409)
    }

    const ticket = await getEventTicketById(c.env.VMS_DB, payload.ticketId)
    if (!ticket || ticket.eventId !== payload.eventId) {
      return c.json({ error: 'التذكرة المختارة غير متاحة لهذه الفعالية.' }, 400)
    }

    const activeRegistrations = await countActiveRegistrationsForTicket(c.env.VMS_DB, payload.ticketId)
    if (activeRegistrations >= ticket.quantity) {
      return c.json({ error: 'لم يعد هناك مقاعد متاحة لهذه التذكرة.' }, 409)
    }

    const eventRegistrationId = crypto.randomUUID()
    const eventRegistration = await createEventRegistration(c.env.VMS_DB, eventRegistrationId, {
      ...payload,
      status: 'registered',
    })
    const [enrichedRegistration] = await enrichEventRegistrationsWithDisplayNames(c.env.MEMBERS_DB, [
      eventRegistration!,
    ])

    return c.json({ eventRegistration: enrichedRegistration }, 201)
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
      const actorMembershipNumber = getActorMembershipNumber(c)

      const existing = await getEventRegistrationById(c.env.VMS_DB, id)
      if (!existing) {
        return c.json({ error: 'Event registration not found.' }, 404)
      }

      const event = await getEventById(c.env.VMS_DB, existing.eventId)
      if (!event) {
        return c.json({ error: 'Event not found.' }, 404)
      }

      const canManage = await canManageEvent(c.env.VMS_DB, event, actorMembershipNumber)
      if (!canManage) {
        return c.json({ error: 'Only event managers can update registrations.' }, 403)
      }

      const eventRegistration = await updateEventRegistrationById(c.env.VMS_DB, id, payload)
      const [enrichedRegistration] = await enrichEventRegistrationsWithDisplayNames(c.env.MEMBERS_DB, [
        eventRegistration!,
      ])
      return c.json({ eventRegistration: enrichedRegistration })
    } catch (error) {
      console.error('Failed to update event registration', error)
      return c.json({ error: 'Could not update event registration.' }, 500)
    }
  },
)

vmsEventRegistrationsRoute.post(
  '/event-registrations/:id/self-cancel',
  zValidator('param', eventRegistrationParamsSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const actorMembershipNumber = getActorMembershipNumber(c)

      const registration = await getEventRegistrationById(c.env.VMS_DB, id)
      if (!registration) {
        return c.json({ error: 'Event registration not found.' }, 404)
      }

      const event = await getEventById(c.env.VMS_DB, registration.eventId)
      if (!event) {
        return c.json({ error: 'Event not found.' }, 404)
      }

      const authorization = canSelfCancelRegistration(event, registration, actorMembershipNumber)
      if (!authorization.allowed) {
        return c.json({ error: authorization.reason }, 403)
      }

      const deleted = await deleteEventRegistrationById(c.env.VMS_DB, id)
      if (!deleted) {
        return c.json({ error: 'Event registration not found.' }, 404)
      }

      return c.json({ message: 'تم إلغاء التسجيل بنجاح.' })
    } catch (error) {
      console.error('Failed to self-cancel event registration', error)
      return c.json({ error: 'Could not cancel event registration.' }, 500)
    }
  },
)

vmsEventRegistrationsRoute.delete('/event-registrations/:id', zValidator('param', eventRegistrationParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const actorMembershipNumber = getActorMembershipNumber(c)

    const registration = await getEventRegistrationById(c.env.VMS_DB, id)
    if (!registration) {
      return c.json({ error: 'Event registration not found.' }, 404)
    }

    const event = await getEventById(c.env.VMS_DB, registration.eventId)
    if (!event) {
      return c.json({ error: 'Event not found.' }, 404)
    }

    const canManage = await canManageEvent(c.env.VMS_DB, event, actorMembershipNumber)
    if (!canManage) {
      return c.json({ error: 'Only event managers can delete registrations.' }, 403)
    }

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
      const approver = getActorMembershipNumber(c)
      const type = c.req.query('type')

      const existing = await getEventRegistrationById(c.env.VMS_DB, id)
      if (!existing) {
        return c.json({ error: 'Event registration not found.' }, 404)
      }

      const updateData: { paymentApprovedBy?: string; attendanceApprovedBy?: string } = {}

      if (type === 'payment') {
        updateData.paymentApprovedBy = approver
      } else if (type === 'attendance') {
        updateData.attendanceApprovedBy = approver
      } else {
        return c.json({ error: 'Invalid approval type. Use "payment" or "attendance".' }, 400)
      }

      const eventRegistration = await updateEventRegistrationById(c.env.VMS_DB, id, updateData)
      const [enrichedRegistration] = await enrichEventRegistrationsWithDisplayNames(c.env.MEMBERS_DB, [
        eventRegistration!,
      ])

      return c.json({ eventRegistration: enrichedRegistration })
    } catch (error) {
      console.error('Failed to approve', error)
      return c.json({ error: 'Could not approve.' }, 500)
    }
  },
)
