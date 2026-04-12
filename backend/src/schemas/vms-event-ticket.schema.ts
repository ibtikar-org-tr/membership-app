import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()

export const createEventTicketSchema = z.object({
  eventId: requiredTrimmedString,
  name: requiredTrimmedString.max(160),
  description: optionalTrimmedString,
  pointPrice: z.number().int(),
  currencyPrice: requiredTrimmedString,
  quantity: z.number().int().min(0),
})

export const updateEventTicketSchema = createEventTicketSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const eventTicketParamsSchema = z.object({
  id: requiredTrimmedString,
})

export type CreateEventTicketInput = z.infer<typeof createEventTicketSchema>
export type UpdateEventTicketInput = z.infer<typeof updateEventTicketSchema>
