import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)

export const projectMemberRoleSchema = z.enum(['member', 'manager', 'observer'])

export const createProjectMemberSchema = z.object({
  projectId: requiredTrimmedString,
  membershipNumber: requiredTrimmedString,
  role: projectMemberRoleSchema,
})

export const updateProjectMemberSchema = createProjectMemberSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const projectMemberParamsSchema = z.object({
  projectId: requiredTrimmedString,
  membershipNumber: requiredTrimmedString,
})

export type CreateProjectMemberInput = z.infer<typeof createProjectMemberSchema>
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>
