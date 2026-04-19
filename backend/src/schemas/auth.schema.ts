import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  type: z.enum(['email', 'phone', 'membership_number']),
  value: z.string().trim().min(1),
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  newPassword: z.string().min(8),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
