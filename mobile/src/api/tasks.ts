import { apiGetJson, apiPutJson } from '@/src/api/client'
import type { VmsTask } from '@/src/types/tasks'

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
