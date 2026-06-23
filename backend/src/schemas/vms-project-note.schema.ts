import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()

export const createProjectNoteSchema = z.object({
  projectId: requiredTrimmedString,
  title: requiredTrimmedString.max(160),
})

export const updateProjectNoteSchema = z
  .object({
    title: requiredTrimmedString.max(160).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const projectNoteParamsSchema = z.object({
  id: requiredTrimmedString,
})

export const projectNoteQuerySchema = z.object({
  projectId: optionalTrimmedString,
})

export type CreateProjectNoteInput = z.infer<typeof createProjectNoteSchema>
export type UpdateProjectNoteInput = z.infer<typeof updateProjectNoteSchema>
