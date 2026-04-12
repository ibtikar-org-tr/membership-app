import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()

export const projectStatusSchema = z.enum(['active', 'completed', 'archived'])

export const createProjectSchema = z.object({
  name: requiredTrimmedString.max(160),
  description: optionalTrimmedString,
  parentProjectId: optionalTrimmedString,
  owner: requiredTrimmedString,
  telegramGroupId: optionalTrimmedString,
  status: projectStatusSchema,
})

export const updateProjectSchema =
  createProjectSchema
    .partial()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const projectParamsSchema = z.object({
  id: requiredTrimmedString,
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
