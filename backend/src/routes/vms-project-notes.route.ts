import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  createProjectNote,
  deleteProjectNoteById,
  getProjectNoteById,
  listProjectNotes,
  updateProjectNoteById,
} from '../repositories/vms-project-notes.repository'
import { getProjectMember } from '../repositories/vms-project-members.repository'
import { getProjectById } from '../repositories/vms-projects.repository'
import { getUserDisplayNamesByMembershipNumbers } from '../repositories/user-info.repository'
import {
  createProjectNoteSchema,
  projectNoteParamsSchema,
  updateProjectNoteSchema,
} from '../schemas/vms-project-note.schema'
import type { AppBindings } from '../types/bindings'
import type { AppEnv } from '../types/hono'
import { getActorMembershipNumber } from '../utils/actor'
import { verifyAccessToken } from '../utils/jwt'

export const vmsProjectNotesRoute = new Hono<AppEnv>()

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

async function canViewProject(db: AppBindings['VMS_DB'], projectId: string, membershipNumber: string) {
  const project = await getProjectById(db, projectId)

  if (!project) {
    return { project: null, isAuthorized: false, canEdit: false }
  }

  if (project.owner === membershipNumber) {
    return { project, isAuthorized: true, canEdit: true }
  }

  const membership = await getProjectMember(db, projectId, membershipNumber)
  if (!membership) {
    return { project, isAuthorized: false, canEdit: false }
  }

  return {
    project,
    isAuthorized: true,
    canEdit: membership.role !== 'observer',
  }
}

vmsProjectNotesRoute.get('/project-notes', async (c) => {
  try {
    const actorMembershipNumber = getActorMembershipNumber(c)
    const projectId = c.req.query('projectId')?.trim()

    if (!projectId) {
      return c.json({ error: 'projectId is required.' }, 400)
    }

    const access = await canViewProject(c.env.VMS_DB, projectId, actorMembershipNumber)
    if (!access.project) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    if (!access.isAuthorized) {
      return c.json({ error: 'You are not a member of this project.' }, 403)
    }

    const notes = await listProjectNotes(c.env.VMS_DB, projectId)
    const creatorNumbers = [...new Set(notes.map((note) => note.createdBy))]
    const displayNameMap = await getUserDisplayNamesByMembershipNumbers(c.env.MEMBERS_DB, creatorNumbers)

    return c.json({
      notes: notes.map((note) => ({
        ...note,
        createdByDisplayName: displayNameMap.get(note.createdBy) ?? note.createdBy,
      })),
    })
  } catch (error) {
    console.error('Failed to list project notes', error)
    return c.json({ error: 'Could not fetch project notes.' }, 500)
  }
})

vmsProjectNotesRoute.get('/project-notes/:id', zValidator('param', projectNoteParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const actorMembershipNumber = getActorMembershipNumber(c)
    const note = await getProjectNoteById(c.env.VMS_DB, id)

    if (!note) {
      return c.json({ error: 'Note not found.' }, 404)
    }

    const access = await canViewProject(c.env.VMS_DB, note.projectId, actorMembershipNumber)
    if (!access.project) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    if (!access.isAuthorized) {
      return c.json({ error: 'You are not a member of this project.' }, 403)
    }

    const displayNameMap = await getUserDisplayNamesByMembershipNumbers(c.env.MEMBERS_DB, [note.createdBy])

    return c.json({
      note: {
        ...note,
        createdByDisplayName: displayNameMap.get(note.createdBy) ?? note.createdBy,
        canEdit: access.canEdit,
      },
    })
  } catch (error) {
    console.error('Failed to fetch project note', error)
    return c.json({ error: 'Could not fetch project note.' }, 500)
  }
})

vmsProjectNotesRoute.post('/project-notes', zValidator('json', createProjectNoteSchema), async (c) => {
  try {
    const actorMembershipNumber = getActorMembershipNumber(c)
    const payload = c.req.valid('json')
    const authorization = await canManageProject(c.env.VMS_DB, payload.projectId, actorMembershipNumber)

    if (!authorization.project) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    if (!authorization.isAuthorized) {
      return c.json({ error: 'Only project owner or managers can create notes.' }, 403)
    }

    const noteId = crypto.randomUUID()
    const note = await createProjectNote(c.env.VMS_DB, noteId, actorMembershipNumber, payload)
    return c.json({ note }, 201)
  } catch (error) {
    console.error('Failed to create project note', error)
    return c.json({ error: 'Could not create project note.' }, 500)
  }
})

vmsProjectNotesRoute.put(
  '/project-notes/:id',
  zValidator('param', projectNoteParamsSchema),
  zValidator('json', updateProjectNoteSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const actorMembershipNumber = getActorMembershipNumber(c)
      const note = await getProjectNoteById(c.env.VMS_DB, id)

      if (!note) {
        return c.json({ error: 'Note not found.' }, 404)
      }

      const authorization = await canManageProject(c.env.VMS_DB, note.projectId, actorMembershipNumber)
      if (!authorization.isAuthorized) {
        return c.json({ error: 'Only project owner or managers can rename notes.' }, 403)
      }

      const payload = c.req.valid('json')
      const updatedNote = await updateProjectNoteById(c.env.VMS_DB, id, payload)
      return c.json({ note: updatedNote })
    } catch (error) {
      console.error('Failed to update project note', error)
      return c.json({ error: 'Could not update project note.' }, 500)
    }
  },
)

vmsProjectNotesRoute.delete('/project-notes/:id', zValidator('param', projectNoteParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const actorMembershipNumber = getActorMembershipNumber(c)
    const note = await getProjectNoteById(c.env.VMS_DB, id)

    if (!note) {
      return c.json({ error: 'Note not found.' }, 404)
    }

    const authorization = await canManageProject(c.env.VMS_DB, note.projectId, actorMembershipNumber)
    if (!authorization.isAuthorized) {
      return c.json({ error: 'Only project owner or managers can delete notes.' }, 403)
    }

    await deleteProjectNoteById(c.env.VMS_DB, id)
    return c.json({ message: 'Note deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete project note', error)
    return c.json({ error: 'Could not delete project note.' }, 500)
  }
})

export async function handleProjectNoteWebSocket(
  request: Request,
  env: AppBindings,
  noteId: string,
): Promise<Response> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade.', { status: 426 })
  }

  const url = new URL(request.url)
  const queryToken = url.searchParams.get('token')?.trim()
  const headerToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim()
  const token = queryToken || headerToken

  if (!noteId) {
    return new Response('Missing note id.', { status: 400 })
  }

  if (!token) {
    return new Response('Missing access token.', { status: 401 })
  }

  const payload = await verifyAccessToken(env, token)
  if (!payload) {
    return new Response('Unauthorized.', { status: 401 })
  }

  const note = await getProjectNoteById(env.VMS_DB, noteId)
  if (!note) {
    return new Response('Note not found.', { status: 404 })
  }

  const access = await canViewProject(env.VMS_DB, note.projectId, payload.sub)
  if (!access.isAuthorized) {
    return new Response('Forbidden.', { status: 403 })
  }

  if (!access.canEdit) {
    return new Response('Read-only project membership.', { status: 403 })
  }

  const displayNameMap = await getUserDisplayNamesByMembershipNumbers(env.MEMBERS_DB, [payload.sub])
  const displayName = displayNameMap.get(payload.sub) ?? payload.sub

  const stub = env.PROJECT_NOTE_ROOM.getByName(noteId)
  const forwardUrl = new URL('https://project-note-room/ws')
  forwardUrl.searchParams.set('noteId', noteId)
  forwardUrl.searchParams.set('membershipNumber', payload.sub)
  forwardUrl.searchParams.set('displayName', displayName)

  return stub.fetch(new Request(forwardUrl.toString(), request))
}
