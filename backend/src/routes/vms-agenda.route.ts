import { Hono } from 'hono'
import {
  listAgendaEventsInRange,
  listAgendaTasksInRange,
  listUnscheduledAgendaTasks,
} from '../repositories/vms-agenda.repository'
import type { AppEnv } from '../types/hono'
import { getActorMembershipNumber } from '../utils/actor'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.+-Z]+)?$/

function isValidRangeBound(value: string | undefined): value is string {
  if (!value || !ISO_DATE_RE.test(value)) {
    return false
  }

  return Number.isFinite(Date.parse(value))
}

export const vmsAgendaRoute = new Hono<AppEnv>()

vmsAgendaRoute.get('/agenda', async (c) => {
  try {
    const membershipNumber = getActorMembershipNumber(c)
    const from = c.req.query('from')?.trim()
    const to = c.req.query('to')?.trim()
    const includeUnscheduled = c.req.query('includeUnscheduled') === '1'

    if (!isValidRangeBound(from) || !isValidRangeBound(to)) {
      return c.json({ error: 'Query params "from" and "to" are required ISO dates.' }, 400)
    }

    if (Date.parse(from) >= Date.parse(to)) {
      return c.json({ error: '"from" must be earlier than "to".' }, 400)
    }

    // Cap range length to roughly one month (+ grid padding ~42 days) to prevent accidental full scans.
    const maxSpanMs = 50 * 24 * 60 * 60 * 1000
    if (Date.parse(to) - Date.parse(from) > maxSpanMs) {
      return c.json({ error: 'Date range is too large. Request at most one month at a time.' }, 400)
    }

    const [tasks, events, unscheduledTasks] = await Promise.all([
      listAgendaTasksInRange(c.env.VMS_DB, membershipNumber, from, to),
      listAgendaEventsInRange(c.env.VMS_DB, membershipNumber, from, to),
      includeUnscheduled ? listUnscheduledAgendaTasks(c.env.VMS_DB, membershipNumber) : Promise.resolve([]),
    ])

    return c.json({
      from,
      to,
      tasks,
      events,
      unscheduledTasks,
    })
  } catch (error) {
    console.error('Failed to fetch agenda', error)
    return c.json({ error: 'Could not fetch agenda.' }, 500)
  }
})
