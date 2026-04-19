import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getDirectProjectByIdForMember, listDirectProjectsForMember } from '../repositories/vms-projects.repository'
import { createTask, deleteTaskById, getTaskById, listTasks, updateTaskById } from '../repositories/vms-tasks.repository'
import { createTaskSchema, taskParamsSchema, updateTaskSchema } from '../schemas/vms-task.schema'
import { sendBackendTelegramNotification } from '../services/telegram-notification.service'
import type { AppBindings } from '../types/bindings'

export const vmsTasksRoute = new Hono<{ Bindings: AppBindings }>()

function buildTaskAssignmentMessage(taskName: string, projectName: string, dueDate?: string) {
  let message = `تم تعيينك للمهمة "${taskName}" في المشروع "${projectName}".`

  if (dueDate) {
    message += `\n
تاريخ الاستحقاق: ${dueDate}`
  }

  message += `\n
يرجى مراجعة تفاصيل المهمة والتقدم عليها.`

  return message
}

async function notifyAssignedTask(
  env: AppBindings,
  assignedTo: string,
  taskName: string,
  projectName: string,
  dueDate?: string,
) {
  if (!assignedTo?.trim()) {
    return
  }

  const message = buildTaskAssignmentMessage(taskName, projectName, dueDate)
  const result = await sendBackendTelegramNotification(env, {
    target: assignedTo.trim(),
    message,
  })

  if (!result.success) {
    console.warn('Telegram assignment notification failed:', result)
  }
}

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

    const taskId = crypto.randomUUID()
    const task = await createTask(c.env.VMS_DB, taskId, payload)

    if (payload.assignedTo?.trim()) {
      await notifyAssignedTask(
        c.env,
        payload.assignedTo,
        task.name,
        project.name,
        task.dueDate ?? undefined,
      )
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

      const task = await updateTaskById(c.env.VMS_DB, id, payload)

      const newAssignee = payload.assignedTo?.trim()
      const currentAssignee = existing.assignedTo?.trim()
      if (newAssignee && newAssignee !== currentAssignee) {
        await notifyAssignedTask(c.env, newAssignee, task.name, project.name, task.dueDate ?? undefined)
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
