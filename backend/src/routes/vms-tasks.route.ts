import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getDirectProjectByIdForMember, listDirectProjectsForMember } from '../repositories/vms-projects.repository'
import { createTask, deleteTaskById, getTaskById, listTasks, updateTaskById } from '../repositories/vms-tasks.repository'
import { getUserProfileByMembershipNumber } from '../repositories/user-info.repository'
import { createTaskSchema, taskParamsSchema, updateTaskSchema } from '../schemas/vms-task.schema'
import { notifyAssignedTask } from '../services/task-assignment-notification.service'
import { syncTaskCompletionPoints, type TaskPointsState } from '../services/task-points.service'

import type { AppBindings } from '../types/bindings'

function toPointsState(task: {
  id: string
  points: number
  assignedTo: string | null
  completedBy: string | null
  approvedBy: string | null
}): TaskPointsState {
  return {
    id: task.id,
    points: task.points,
    assignedTo: task.assignedTo,
    completedBy: task.completedBy,
    approvedBy: task.approvedBy,
  }
}

export const vmsTasksRoute = new Hono<{ Bindings: AppBindings }>()

vmsTasksRoute.get('/tasks', async (c) => {
  try {
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const directProjects = await listDirectProjectsForMember(c.env.VMS_DB, membershipNumber)
    const directProjectIds = new Set(directProjects.map((project) => project.id))
    const tasks = await listTasks(c.env.VMS_DB)
    return c.json({ tasks: tasks.filter((task) => directProjectIds.has(task.projectId)) })
  } catch (error) {
    console.error('Failed to list tasks', error)
    return c.json({ error: 'Could not fetch tasks.' }, 500)
  }
})

vmsTasksRoute.get('/tasks/:id', zValidator('param', taskParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const task = await getTaskById(c.env.VMS_DB, id)

    if (!task) {
      return c.json({ error: 'Task not found.' }, 404)
    }

    const project = await getDirectProjectByIdForMember(c.env.VMS_DB, task.projectId, membershipNumber)
    if (!project) {
      return c.json({ error: 'Task not found.' }, 404)
    }

    return c.json({ task })
  } catch (error) {
    console.error('Failed to fetch task', error)
    return c.json({ error: 'Could not fetch task.' }, 500)
  }
})

vmsTasksRoute.post('/tasks', zValidator('json', createTaskSchema), async (c) => {
  try {
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const payload = c.req.valid('json')
    if (payload.createdBy.trim() !== membershipNumber) {
      return c.json({ error: 'Created by must match your membership number.' }, 403)
    }

    const project = await getDirectProjectByIdForMember(c.env.VMS_DB, payload.projectId, membershipNumber)
    if (!project) {
      return c.json({ error: 'Project not found.' }, 404)
    }

    const projectOwnerProfile = await getUserProfileByMembershipNumber(c.env.MEMBERS_DB, project.owner)

    const taskId = crypto.randomUUID()
    const task = await createTask(c.env.VMS_DB, taskId, payload)

    if (!task) {
      return c.json({ error: 'Could not create task.' }, 500)
    }

    try {
      await syncTaskCompletionPoints(c.env.MEMBERS_DB, c.env.VMS_DB, null, toPointsState(task))
    } catch (pointsError) {
      console.error('Failed to sync task completion points on create', pointsError)
    }

    if (payload.assignedTo?.trim()) {
      await notifyAssignedTask(c.env, {
        assignedTo: payload.assignedTo,
        projectId: project.id,
        projectName: project.name,
        taskName: task.name,
        projectOwnerTelegramId: projectOwnerProfile?.telegramId,
        projectOwnerTelegramUsername: projectOwnerProfile?.telegramUsername,
        dueDate: task.dueDate,
        description: task.description,
        priority: task.priority,
        points: task.points,
      })
    }

    return c.json({ task }, 201)
  } catch (error) {
    console.error('Failed to create task', error)
    return c.json({ error: 'Could not create task.' }, 500)
  }
})

vmsTasksRoute.put(
  '/tasks/:id',
  zValidator('param', taskParamsSchema),
  zValidator('json', updateTaskSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const membershipNumber = c.req.query('membershipNumber')?.trim()

      if (!membershipNumber) {
        return c.json({ error: 'Membership number is required.' }, 400)
      }

      const payload = c.req.valid('json')

      const existing = await getTaskById(c.env.VMS_DB, id)
      if (!existing) {
        return c.json({ error: 'Task not found.' }, 404)
      }

      const project = await getDirectProjectByIdForMember(c.env.VMS_DB, existing.projectId, membershipNumber)
      if (!project) {
        return c.json({ error: 'Task not found.' }, 404)
      }

      const projectOwnerProfile = await getUserProfileByMembershipNumber(c.env.MEMBERS_DB, project.owner)

      const task = await updateTaskById(c.env.VMS_DB, id, payload)

      if (!task) {
        return c.json({ error: 'Task not found.' }, 404)
      }

      try {
        await syncTaskCompletionPoints(
          c.env.MEMBERS_DB,
          c.env.VMS_DB,
          toPointsState(existing),
          toPointsState(task),
        )
      } catch (pointsError) {
        console.error('Failed to sync task completion points on update', pointsError)
      }

      const newAssignee = payload.assignedTo?.trim()
      const currentAssignee = existing.assignedTo?.trim()
      if (newAssignee && newAssignee !== currentAssignee) {
        await notifyAssignedTask(c.env, {
          assignedTo: newAssignee,
          projectId: project.id,
          projectName: project.name,
          taskName: task.name,
          projectOwnerTelegramId: projectOwnerProfile?.telegramId,
          projectOwnerTelegramUsername: projectOwnerProfile?.telegramUsername,
          dueDate: task.dueDate,
          description: task.description,
          priority: task.priority,
          points: task.points,
        })
      }

      return c.json({ task })
    } catch (error) {
      console.error('Failed to update task', error)
      return c.json({ error: 'Could not update task.' }, 500)
    }
  },
)

vmsTasksRoute.delete('/tasks/:id', zValidator('param', taskParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const membershipNumber = c.req.query('membershipNumber')?.trim()

    if (!membershipNumber) {
      return c.json({ error: 'Membership number is required.' }, 400)
    }

    const existing = await getTaskById(c.env.VMS_DB, id)
    if (!existing) {
      return c.json({ error: 'Task not found.' }, 404)
    }

    const project = await getDirectProjectByIdForMember(c.env.VMS_DB, existing.projectId, membershipNumber)
    if (!project) {
      return c.json({ error: 'Task not found.' }, 404)
    }

    const deleted = await deleteTaskById(c.env.VMS_DB, id)

    if (!deleted) {
      return c.json({ error: 'Task not found.' }, 404)
    }

    return c.json({ message: 'Task deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete task', error)
    return c.json({ error: 'Could not delete task.' }, 500)
  }
})
