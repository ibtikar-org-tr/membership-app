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

export const eventRegistrantContactParamsSchema = z.object({
  eventId: requiredTrimmedString,
  membershipNumber: requiredTrimmedString,
})

export const eventRegistrationCountsParamsSchema = z.object({
  eventId: requiredTrimmedString,
})

export const changeEventRegistrationTicketSchema = z.object({
  ticketId: requiredTrimmedString,
})

export const createGuestEventRegistrationSchema = z.object({
  ticketId: requiredTrimmedString,
  guestName: requiredTrimmedString.max(320),
  guestEmail: z.string().trim().toLowerCase().email(),
  guestPhone: requiredTrimmedString.max(40),
})

export type CreateEventRegistrationInput = z.infer<typeof createEventRegistrationSchema>
export type UpdateEventRegistrationInput = z.infer<typeof updateEventRegistrationSchema>
export type CreateGuestEventRegistrationInput = z.infer<typeof createGuestEventRegistrationSchema>
