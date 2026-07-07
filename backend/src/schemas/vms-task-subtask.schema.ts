import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)

const subtaskStatusSchema = z.enum(['open', 'completed'])

export const taskSubtaskParamsSchema = z.object({
  id: requiredTrimmedString,
  subtaskId: requiredTrimmedString,
})

export const createTaskSubtaskSchema = z.object({
  name: requiredTrimmedString.max(160),
})

export const updateTaskSubtaskSchema = z
  .object({
    name: requiredTrimmedString.max(160).optional(),
    status: subtaskStatusSchema.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export type CreateTaskSubtaskInput = z.infer<typeof createTaskSubtaskSchema>
export type UpdateTaskSubtaskInput = z.infer<typeof updateTaskSubtaskSchema>
