import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()

const skillNameSchema = z.string().trim().min(1).regex(/^[a-z][a-z0-9_]*$/)

export const createSkillSchema = z.object({
  name: skillNameSchema,
  description: optionalTrimmedString,
  members: z.number().int().nonnegative().optional(),
  events: z.number().int().nonnegative().optional(),
  tasks: z.number().int().nonnegative().optional(),
})

export const updateSkillSchema = createSkillSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const skillParamsSchema = z.object({
  name: requiredTrimmedString,
})

export type CreateSkillInput = z.infer<typeof createSkillSchema>
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>
