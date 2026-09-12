import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)

/** All roles stored in project_members (including mirrored owner). */
export const projectMemberRoleSchema = z.enum(['owner', 'member', 'manager', 'observer'])

/** Roles that can be assigned through the public member APIs (not ownership transfer). */
export const assignableProjectMemberRoleSchema = z.enum(['member', 'manager', 'observer'])

export const createProjectMemberSchema = z.object({
  projectId: requiredTrimmedString,
  membershipNumber: requiredTrimmedString,
  role: assignableProjectMemberRoleSchema,
})

export const updateProjectMemberSchema = z
  .object({
    projectId: requiredTrimmedString.optional(),
    membershipNumber: requiredTrimmedString.optional(),
    role: assignableProjectMemberRoleSchema.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required')

export const projectMemberParamsSchema = z.object({
  projectId: requiredTrimmedString,
  membershipNumber: requiredTrimmedString,
})

export type ProjectMemberRole = z.infer<typeof projectMemberRoleSchema>
export type AssignableProjectMemberRole = z.infer<typeof assignableProjectMemberRoleSchema>
export type CreateProjectMemberInput = {
  projectId: string
  membershipNumber: string
  role: ProjectMemberRole
}
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>
