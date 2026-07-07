import { z } from 'zod'

const requiredTrimmedString = z.string().trim().min(1)

export const generateTaskWithAiSchema = z.object({
  projectId: requiredTrimmedString,
  prompt: requiredTrimmedString.max(4000),
})

export const aiGeneratedTaskSchema = z.object({
  name: requiredTrimmedString.max(160),
  description: z.string().trim().max(4000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  subtasks: z.array(requiredTrimmedString.max(160)).max(20).default([]),
})

export type GenerateTaskWithAiInput = z.infer<typeof generateTaskWithAiSchema>
export type AiGeneratedTask = z.infer<typeof aiGeneratedTaskSchema>
