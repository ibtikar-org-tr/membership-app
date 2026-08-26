export interface VmsTask {
  id: string
  createdAt: string
  updatedAt: string
  projectId: string
  name: string
  description: string | null
  createdBy: string
  status: 'open' | 'in_progress' | 'completed' | 'archived' | string
  priority: 'low' | 'medium' | 'high' | string
  dueDate: string | null
  points: number
  assignedTo: string | null
  completedBy: string | null
  completedAt: string | null
  approvedBy: string | null
  lastRemindedAt: string | null
  skills: Record<string, string> | null
  subtaskProgress?: { completed: number; total: number } | null
}
