import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()
const eventSkillsSchema = z.record(z.string().trim().min(1), z.string().trim().min(1)).optional()
const eventUrlsSchema = z.object({}).passthrough().optional()

export const createEventSchema = z.object({
  name: requiredTrimmedString.max(160),
  description: optionalTrimmedString,
  startTime: optionalTrimmedString,
  endTime: optionalTrimmedString,
  location: optionalTrimmedString,
  imageUrls: eventUrlsSchema,
  associatedUrls: eventUrlsSchema,
  createdBy: requiredTrimmedString,
  projectId: requiredTrimmedString,
  skills: eventSkillsSchema,
  telegramGroupId: optionalTrimmedString,
})

export const updateEventSchema = createEventSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const eventParamsSchema = z.object({
  id: requiredTrimmedString,
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
