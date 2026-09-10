import { apiGetJson, apiPostJson, apiPutJson } from '@/src/api/client'
import type { VmsTask, VmsTaskSubtask } from '@/src/types/tasks'

export function fetchTasks(options?: {
  statuses?: Array<'open' | 'in_progress' | 'completed' | 'archived' | string>
}) {
  const params = new URLSearchParams()
  if (options?.statuses && options.statuses.length > 0) {
    params.set('status', options.statuses.join(','))
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiGetJson<{ tasks: VmsTask[] }>(`/tasks${query}`)
}

export function createTask(payload: {
  projectId: string
  name: string
  description?: string
  createdBy: string
  status?: 'open' | 'in_progress' | 'completed' | 'archived'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  points?: number
}) {
  return apiPostJson<{ task: VmsTask }, typeof payload>('/tasks', payload)
}

export function updateTask(
  taskId: string,
  payload: Partial<{
    status: 'open' | 'in_progress' | 'completed' | 'archived'
    priority: 'low' | 'medium' | 'high'
    name: string
    description: string
    dueDate: string
  }>,
) {
  return apiPutJson<{ task: VmsTask }, typeof payload>(
    `/tasks/${encodeURIComponent(taskId)}`,
    payload,
  )
}

export function fetchTaskSubtasks(taskId: string) {
  return apiGetJson<{ subtasks: VmsTaskSubtask[] }>(
    `/tasks/${encodeURIComponent(taskId)}/subtasks`,
  )
}

export function updateTaskSubtask(
  taskId: string,
  subtaskId: string,
  payload: Partial<{ name: string; status: 'open' | 'completed' }>,
) {
  return apiPutJson<{ subtask: VmsTaskSubtask }, typeof payload>(
    `/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`,
    payload,
  )
}
