import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)

export const eventRegistrationStatusSchema = z.enum(['registered', 'attended', 'cancelled', 'no_show'])

export const createEventRegistrationSchema = z.object({
  eventId: requiredTrimmedString,
  membershipNumber: requiredTrimmedString,
  ticketId: requiredTrimmedString,
  status: eventRegistrationStatusSchema,
  paymentApprovedBy: requiredTrimmedString.optional(),
  attendanceApprovedBy: requiredTrimmedString.optional(),
})

export const updateEventRegistrationSchema = createEventRegistrationSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const eventRegistrationParamsSchema = z.object({
  id: requiredTrimmedString,
})

export type CreateEventRegistrationInput = z.infer<typeof createEventRegistrationSchema>
export type UpdateEventRegistrationInput = z.infer<typeof updateEventRegistrationSchema>
