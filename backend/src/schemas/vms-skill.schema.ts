import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()

const skillNameSchema = z.string().trim().min(1).regex(/^[a-z0-9][a-z0-9_-]*$/i)
const skillIdSchema = z.string().trim().uuid()

export const createSkillSchema = z.object({
  name: skillNameSchema,
  description: optionalTrimmedString,
})

export const searchSkillsSchema = z.object({
  search: optionalTrimmedString,
})

export const skillParamsSchema = z.object({
  id: skillIdSchema,
})

export type CreateSkillInput = z.infer<typeof createSkillSchema>
export type SearchSkillsInput = z.infer<typeof searchSkillsSchema>
