import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)
const optionalTrimmedString = z.string().trim().min(1).optional()

export const clubVisibilitySchema = z.enum(['public', 'private', 'draft'])
export const clubJoinPolicySchema = z.enum(['auto_approve', 'request_to_join', 'invite_only'])
export const clubMemberStatusSchema = z.enum(['active', 'pending', 'rejected'])
const clubSkillsSchema = z.record(z.string().trim().min(1), z.string().trim().min(1)).optional()

export const createClubSchema = z.object({
  projectId: requiredTrimmedString,
  name: requiredTrimmedString.max(160),
  description: optionalTrimmedString,
  visibility: clubVisibilitySchema,
  joinPolicy: clubJoinPolicySchema,
  skills: clubSkillsSchema,
})

export const updateClubSchema = createClubSchema
  .omit({ projectId: true })
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const clubParamsSchema = z.object({
  id: requiredTrimmedString,
})

export const createClubMembershipSchema = z.object({
  clubId: requiredTrimmedString,
  membershipNumber: requiredTrimmedString,
})

export const updateClubMembershipSchema = z.object({
  status: clubMemberStatusSchema,
})

export const clubMembershipParamsSchema = z.object({
  clubId: requiredTrimmedString,
  membershipNumber: requiredTrimmedString,
})

export type CreateClubInput = z.infer<typeof createClubSchema>
export type UpdateClubInput = z.infer<typeof updateClubSchema>
export type CreateClubMembershipInput = z.infer<typeof createClubMembershipSchema>
export type UpdateClubMembershipInput = z.infer<typeof updateClubMembershipSchema>
