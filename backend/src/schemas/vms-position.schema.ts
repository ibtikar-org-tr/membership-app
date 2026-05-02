import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()

export const positionStatusSchema = z.enum(['open', 'filled', 'closed'])
export const positionApplicationStatusSchema = z.enum(['pending', 'accepted', 'rejected'])

export const createPositionSchema = z.object({
  projectId: requiredTrimmedString,
  name: requiredTrimmedString.max(160),
  description: optionalTrimmedString,
  createdBy: requiredTrimmedString,
  seats: z.coerce.number().int().min(1).max(999).optional(),
  status: positionStatusSchema.optional(),
})

export const updatePositionSchema = createPositionSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const positionParamsSchema = z.object({
  id: requiredTrimmedString,
})

export const positionApplicationParamsSchema = z.object({
  id: requiredTrimmedString,
})

export const createPositionApplicationSchema = z.object({
  motivationLetter: optionalTrimmedString,
})

export const reviewPositionApplicationSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
})

export type CreatePositionInput = z.infer<typeof createPositionSchema>
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>
export type CreatePositionApplicationInput = z.infer<typeof createPositionApplicationSchema>
export type ReviewPositionApplicationInput = z.infer<typeof reviewPositionApplicationSchema>