import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getUserDisplayNamesByMembershipNumbers } from '../repositories/user-info.repository'
import {
  createClubMember,
  deleteClubMember,
  getClubMember,
  listClubMembers,
  updateClubMember,
} from '../repositories/vms-club-members.repository'
import {
  createClub,
  deleteClubById,
  getClubById,
  listClubs,
  updateClubById,
} from '../repositories/vms-clubs.repository'
import { getProjectMember } from '../repositories/vms-project-members.repository'
import { getProjectById } from '../repositories/vms-projects.repository'
import {
  clubMembershipParamsSchema,
  clubParamsSchema,
  createClubMembershipSchema,
  createClubSchema,
  updateClubMembershipSchema,
  updateClubSchema,
} from '../schemas/vms-club.schema'
import type { AppBindings } from '../types/bindings'

export const vmsClubsRoute = new Hono<{ Bindings: AppBindings }>()

async function canManageProject(db: AppBindings['VMS_DB'], projectId: string, membershipNumber: string) {
  const project = await getProjectById(db, projectId)

  if (!project) {
    return { project: null, isAuthorized: false }
  }

  if (project.owner === membershipNumber) {
    return { project, isAuthorized: true }
  }

  const membership = await getProjectMember(db, projectId, membershipNumber)
  return {
    project,
    isAuthorized: membership?.role === 'manager',
  }
}

async function enrichClubMembersWithDisplayNames(
  membersDb: AppBindings['MEMBERS_DB'],
  members: Array<{ clubId: string; membershipNumber: string; status: string; displayName: string }>,
) {
  const displayNameMap = await getUserDisplayNamesByMembershipNumbers(
    membersDb,
    members.map((member) => member.membershipNumber),
  )

  return members.map((member) => ({
    ...member,
    displayName: displayNameMap.get(member.membershipNumber) ?? member.displayName ?? member.membershipNumber,
  }))
}

vmsClubsRoute.get('/clubs', async (c) => {
  try {
    const projectId = c.req.query('projectId')?.trim()
    const clubs = await listClubs(c.env.VMS_DB, projectId)
    return c.json({ clubs })
  } catch (error) {
    console.error('Failed to list clubs', error)
    return c.json({ error: 'Could not fetch clubs.' }, 500)
  }
})

vmsClubsRoute.get('/clubs/:id', zValidator('param', clubParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const club = await getClubById(c.env.VMS_DB, id)

    if (!club) {
      return c.json({ error: 'Club not found.' }, 404)
    }

    return c.json({ club })
  } catch (error) {
    console.error('Failed to fetch club', error)
    return c.json({ error: 'Could not fetch club.' }, 500)
  }
})

vmsClubsRoute.post('/clubs', zValidator('json', createClubSchema), async (c) => {
  try {
    const actorMembershipNumber = c.req.query('membershipNumber')?.trim()

    if (!actorMembershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const payload = c.req.valid('json')
    const authorization = await canManageProject(c.env.VMS_DB, payload.projectId, actorMembershipNumber)

    if (!authorization.project) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    if (!authorization.isAuthorized) {
      return c.json({ error: 'Only project owner or managers can create clubs.' }, 403)
    }

    const clubId = crypto.randomUUID()
    const club = await createClub(c.env.VMS_DB, clubId, payload)
    return c.json({ club }, 201)
  } catch (error) {
    console.error('Failed to create club', error)
    return c.json({ error: 'Could not create club.' }, 500)
  }
})

vmsClubsRoute.put(
  '/clubs/:id',
  zValidator('param', clubParamsSchema),
  zValidator('json', updateClubSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const actorMembershipNumber = c.req.query('membershipNumber')?.trim()

      if (!actorMembershipNumber) {
        return c.json({ error: 'Membership number is required.' }, 400)
      }

      const club = await getClubById(c.env.VMS_DB, id)
      if (!club) {
        return c.json({ error: 'Club not found.' }, 404)
      }

      const authorization = await canManageProject(c.env.VMS_DB, club.projectId, actorMembershipNumber)
      if (!authorization.isAuthorized) {
        return c.json({ error: 'Only project owner or managers can update clubs.' }, 403)
      }

      const payload = c.req.valid('json')
      const updatedClub = await updateClubById(c.env.VMS_DB, id, payload)
      return c.json({ club: updatedClub })
    } catch (error) {
      console.error('Failed to update club', error)
      return c.json({ error: 'Could not update club.' }, 500)
    }
  },
)

vmsClubsRoute.delete('/clubs/:id', zValidator('param', clubParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const actorMembershipNumber = c.req.query('membershipNumber')?.trim()

    if (!actorMembershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const club = await getClubById(c.env.VMS_DB, id)
    if (!club) {
      return c.json({ error: 'Club not found.' }, 404)
    }

    const authorization = await canManageProject(c.env.VMS_DB, club.projectId, actorMembershipNumber)
    if (!authorization.isAuthorized) {
      return c.json({ error: 'Only project owner or managers can delete clubs.' }, 403)
    }

    await deleteClubById(c.env.VMS_DB, id)
    return c.json({ message: 'Club deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete club', error)
    return c.json({ error: 'Could not delete club.' }, 500)
  }
})

vmsClubsRoute.get('/club-members', async (c) => {
  try {
    const clubId = c.req.query('clubId')?.trim()
    const status = c.req.query('status')?.trim()
    const members = await listClubMembers(c.env.VMS_DB, clubId, status)
    const enriched = await enrichClubMembersWithDisplayNames(c.env.MEMBERS_DB, members)

    return c.json({ clubMembers: enriched })
  } catch (error) {
    console.error('Failed to list club members', error)
    return c.json({ error: 'Could not fetch club members.' }, 500)
  }
})

vmsClubsRoute.get(
  '/club-members/:clubId/:membershipNumber',
  zValidator('param', clubMembershipParamsSchema),
  async (c) => {
    try {
      const { clubId, membershipNumber } = c.req.valid('param')
      const clubMember = await getClubMember(c.env.VMS_DB, clubId, membershipNumber)

      if (!clubMember) {
        return c.json({ error: 'Club member not found.' }, 404)
      }

      const enriched = await enrichClubMembersWithDisplayNames(c.env.MEMBERS_DB, [clubMember])
      return c.json({ clubMember: enriched[0] })
    } catch (error) {
      console.error('Failed to fetch club member', error)
      return c.json({ error: 'Could not fetch club member.' }, 500)
    }
  },
)

vmsClubsRoute.post('/club-members', zValidator('json', createClubMembershipSchema), async (c) => {
  try {
    const actorMembershipNumber = c.req.query('membershipNumber')?.trim()

    if (!actorMembershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const payload = c.req.valid('json')
    const club = await getClubById(c.env.VMS_DB, payload.clubId)

    if (!club) {
      return c.json({ error: 'Club not found.' }, 404)
    }

    const project = await getProjectById(c.env.VMS_DB, club.projectId)
    if (!project) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    const actorProjectMembership = await getProjectMember(c.env.VMS_DB, club.projectId, actorMembershipNumber)
    const targetProjectMembership = await getProjectMember(c.env.VMS_DB, club.projectId, payload.membershipNumber)
    const isProjectOwner = project.owner === actorMembershipNumber
    const isManager = actorProjectMembership?.role === 'manager'
    const isSelfJoin = payload.membershipNumber === actorMembershipNumber
    const targetIsProjectMember = Boolean(targetProjectMembership) || project.owner === payload.membershipNumber

    if (!targetIsProjectMember) {
      return c.json({ error: 'Only project members can join clubs.' }, 403)
    }

    if (!isSelfJoin && !isProjectOwner && !isManager) {
      return c.json({ error: 'Only project owner or managers can add other members to clubs.' }, 403)
    }

    const existing = await getClubMember(c.env.VMS_DB, payload.clubId, payload.membershipNumber)
    if (existing) {
      const enrichedExisting = await enrichClubMembersWithDisplayNames(c.env.MEMBERS_DB, [existing])
      return c.json({ clubMember: enrichedExisting[0] })
    }

    if (isSelfJoin && !isProjectOwner && !isManager && club.joinPolicy === 'invite_only') {
      return c.json({ error: 'This club is invite only.' }, 403)
    }

    const status =
      isSelfJoin && !isProjectOwner && !isManager && (club.joinPolicy === 'request_to_join' || club.visibility === 'private')
        ? 'pending'
        : 'active'
    const clubMember = await createClubMember(c.env.VMS_DB, payload, status)

    if (!clubMember) {
      return c.json({ error: 'Could not create club member.' }, 500)
    }

    const enriched = await enrichClubMembersWithDisplayNames(c.env.MEMBERS_DB, [clubMember])
    return c.json({ clubMember: enriched[0] }, 201)
  } catch (error) {
    console.error('Failed to create club member', error)
    return c.json({ error: 'Could not create club member.' }, 500)
  }
})

vmsClubsRoute.put(
  '/club-members/:clubId/:membershipNumber',
  zValidator('param', clubMembershipParamsSchema),
  zValidator('json', updateClubMembershipSchema),
  async (c) => {
    try {
      const { clubId, membershipNumber } = c.req.valid('param')
      const actorMembershipNumber = c.req.query('membershipNumber')?.trim()

      if (!actorMembershipNumber) {
        return c.json({ error: 'Membership number is required.' }, 400)
      }

      const club = await getClubById(c.env.VMS_DB, clubId)
      if (!club) {
        return c.json({ error: 'Club not found.' }, 404)
      }

      const authorization = await canManageProject(c.env.VMS_DB, club.projectId, actorMembershipNumber)
      if (!authorization.isAuthorized) {
        return c.json({ error: 'Only project owner or managers can update club members.' }, 403)
      }

      const payload = c.req.valid('json')
      const existing = await getClubMember(c.env.VMS_DB, clubId, membershipNumber)
      if (!existing) {
        return c.json({ error: 'Club member not found.' }, 404)
      }

      const clubMember = await updateClubMember(c.env.VMS_DB, clubId, membershipNumber, payload)

      if (!clubMember) {
        return c.json({ error: 'Club member not found.' }, 404)
      }

      const enriched = await enrichClubMembersWithDisplayNames(c.env.MEMBERS_DB, [clubMember])
      return c.json({ clubMember: enriched[0] })
    } catch (error) {
      console.error('Failed to update club member', error)
      return c.json({ error: 'Could not update club member.' }, 500)
    }
  },
)

vmsClubsRoute.delete(
  '/club-members/:clubId/:membershipNumber',
  zValidator('param', clubMembershipParamsSchema),
  async (c) => {
    try {
      const { clubId, membershipNumber } = c.req.valid('param')
      const actorMembershipNumber = c.req.query('membershipNumber')?.trim()

      if (!actorMembershipNumber) {
        return c.json({ error: 'Membership number is required.' }, 400)
      }

      const club = await getClubById(c.env.VMS_DB, clubId)
      if (!club) {
        return c.json({ error: 'Club not found.' }, 404)
      }

      const authorization = await canManageProject(c.env.VMS_DB, club.projectId, actorMembershipNumber)
      const isSelfRemoval = actorMembershipNumber === membershipNumber

      if (!authorization.isAuthorized && !isSelfRemoval) {
        return c.json({ error: 'Only project owner or managers can remove other club members.' }, 403)
      }

      const deleted = await deleteClubMember(c.env.VMS_DB, clubId, membershipNumber)

      if (!deleted) {
        return c.json({ error: 'Club member not found.' }, 404)
      }

      return c.json({ message: 'Club member deleted successfully.' })
    } catch (error) {
      console.error('Failed to delete club member', error)
      return c.json({ error: 'Could not delete club member.' }, 500)
    }
  },
)
