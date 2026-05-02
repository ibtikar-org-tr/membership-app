import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)

export const pointTransactionTypeSchema = z.enum(['task_reward', 'purchase', 'event_attendance', 'other'])

export const createPointTransactionSchema = z.object({
  membershipNumber: requiredTrimmedString,
  taskId: requiredTrimmedString.optional(),
  amount: z.number().int(),
  type: pointTransactionTypeSchema,
})

export const updatePointTransactionSchema = createPointTransactionSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const pointTransactionParamsSchema = z.object({
  id: requiredTrimmedString,
})

export type CreatePointTransactionInput = z.infer<typeof createPointTransactionSchema>
export type UpdatePointTransactionInput = z.infer<typeof updatePointTransactionSchema>
