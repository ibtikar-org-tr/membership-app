import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()

const taskStatusSchema = z.enum(['open', 'in_progress', 'completed', 'archived'])

const taskSkillsSchema = z.record(z.string().trim().min(1), z.string().trim().min(1)).optional()

export const createTaskSchema = z.object({
  projectId: requiredTrimmedString,
  name: requiredTrimmedString.max(160),
  description: optionalTrimmedString,
  createdBy: requiredTrimmedString,
  status: taskStatusSchema.default('open'),
  dueDate: optionalTrimmedString,
  points: z.number().int().min(0).optional(),
  assignedTo: optionalTrimmedString,
  completedBy: optionalTrimmedString,
  completedAt: optionalTrimmedString,
  approvedBy: optionalTrimmedString,
  skills: taskSkillsSchema,
})

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const taskParamsSchema = z.object({
  id: requiredTrimmedString,
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
