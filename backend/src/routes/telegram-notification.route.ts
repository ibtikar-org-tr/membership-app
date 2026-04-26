import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getClubMember } from '../repositories/vms-club-members.repository'
import { getClubById } from '../repositories/vms-clubs.repository'
import { listEventRegistrations } from '../repositories/vms-event-registrations.repository'
import { getEventById } from '../repositories/vms-events.repository'
import { getProjectMember } from '../repositories/vms-project-members.repository'
import { getProjectById } from '../repositories/vms-projects.repository'
import { sendBackendTelegramGroupInvite, sendBackendTelegramNotification } from '../services/telegram-notification.service'
import type { AppBindings } from '../types/bindings'

export const telegramNotificationRoute = new Hono<{ Bindings: AppBindings }>()

const notifyTelegramSchema = z.object({
  target: z.string().trim().min(1).optional(),
  targets: z.array(z.string().trim().min(1)).optional(),
  message: z.string().trim().min(1),
  boxes: z.array(z.object({
    text: z.string().trim().min(1),
    link: z.string().url()
  })).optional(),
}).refine((data) => data.target || (data.targets && data.targets.length > 0), {
  message: "Either 'target' or 'targets' must be provided",
})

const groupInviteSchema = z.object({
  resourceType: z.enum(['project', 'club', 'event']),
  resourceId: z.string().trim().min(1),
})

async function canJoinProjectGroup(c: { env: AppBindings }, projectId: string, membershipNumber: string) {
  const project = await getProjectById(c.env.VMS_DB, projectId)
  if (!project) {
    return { allowed: false, status: 404, error: 'Project not found.' as const, groupId: null, contextLabel: null }
  }

  if (project.owner !== membershipNumber) {
    const projectMember = await getProjectMember(c.env.VMS_DB, projectId, membershipNumber)
    if (!projectMember) {
      return { allowed: false, status: 403, error: 'You are not a member of this project.' as const, groupId: null, contextLabel: null }
    }
  }

  if (!project.telegramGroupId?.trim()) {
    return { allowed: false, status: 404, error: 'No telegram group is configured for this project.' as const, groupId: null, contextLabel: null }
  }

  return {
    allowed: true,
    groupId: project.telegramGroupId.trim(),
    contextLabel: `project ${project.name}`,
  }
}

async function canJoinClubGroup(c: { env: AppBindings }, clubId: string, membershipNumber: string) {
  const club = await getClubById(c.env.VMS_DB, clubId)
  if (!club) {
    return { allowed: false, status: 404, error: 'Club not found.' as const, groupId: null, contextLabel: null }
  }

  const clubMember = await getClubMember(c.env.VMS_DB, clubId, membershipNumber)
  if (!clubMember || clubMember.status !== 'active') {
    return { allowed: false, status: 403, error: 'You are not an active member of this club.' as const, groupId: null, contextLabel: null }
  }

  if (!club.telegramGroupId?.trim()) {
    return { allowed: false, status: 404, error: 'No telegram group is configured for this club.' as const, groupId: null, contextLabel: null }
  }

  return {
    allowed: true,
    groupId: club.telegramGroupId.trim(),
    contextLabel: `club ${club.name}`,
  }
}

async function canJoinEventGroup(c: { env: AppBindings }, eventId: string, membershipNumber: string) {
  const event = await getEventById(c.env.VMS_DB, eventId)
  if (!event) {
    return { allowed: false, status: 404, error: 'Event not found.' as const, groupId: null, contextLabel: null }
  }

  const registrations = await listEventRegistrations(c.env.VMS_DB, eventId)
  const registration = registrations.find((entry) => entry.membershipNumber === membershipNumber) ?? null
  if (!registration || (registration.status !== 'registered' && registration.status !== 'attended')) {
    return { allowed: false, status: 403, error: 'You are not registered for this event.' as const, groupId: null, contextLabel: null }
  }

  if (!event.telegramGroupId?.trim()) {
    return { allowed: false, status: 404, error: 'No telegram group is configured for this event.' as const, groupId: null, contextLabel: null }
  }

  return {
    allowed: true,
    groupId: event.telegramGroupId.trim(),
    contextLabel: `event ${event.name}`,
  }
}

telegramNotificationRoute.post(
  '/telegram/notify',
  zValidator('json', notifyTelegramSchema),
  async (c) => {
    try {
      const { target, targets, message, boxes } = c.req.valid('json')

      const result = await sendBackendTelegramNotification(c.env, {
        target,
        targets,
        message,
        boxes,
      })

      if (!result.success) {
        return c.json({ error: result.error ?? 'Telegram notification failed', details: result.responseData }, result.status ?? 500)
      }

      return c.json({ success: true, detail: result.detail, data: result.responseData })
    } catch (error) {
      console.error('Backend telegram notification route error:', error)
      return c.json({ error: 'Failed to send telegram notification' }, 500)
    }
  },
)

telegramNotificationRoute.post(
  '/telegram/group-invite',
  zValidator('json', groupInviteSchema),
  async (c) => {
    try {
      const membershipNumber = c.req.query('membershipNumber')?.trim()
      if (!membershipNumber) {
        return c.json({ error: 'Membership number is required.' }, 400)
      }

      const { resourceType, resourceId } = c.req.valid('json')

      const eligibility =
        resourceType === 'project'
          ? await canJoinProjectGroup(c, resourceId, membershipNumber)
          : resourceType === 'club'
            ? await canJoinClubGroup(c, resourceId, membershipNumber)
            : await canJoinEventGroup(c, resourceId, membershipNumber)

      if (!eligibility.allowed) {
        return c.json({ error: eligibility.error }, eligibility.status ?? 403)
      }

      const result = await sendBackendTelegramGroupInvite(c.env, {
        membershipNumber,
        telegramGroupId: eligibility.groupId,
        contextLabel: eligibility.contextLabel,
      })

      if (!result.success) {
        return c.json({ error: result.error ?? 'Telegram group invite failed', details: result.responseData }, result.status ?? 500)
      }

      return c.json({ success: true, detail: result.detail, data: result.responseData })
    } catch (error) {
      console.error('Backend telegram group invite route error:', error)
      return c.json({ error: 'Failed to send telegram group invite' }, 500)
    }
  },
)
