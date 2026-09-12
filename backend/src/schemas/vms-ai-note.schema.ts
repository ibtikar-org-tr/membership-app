import { z } from 'zod'
import { projectNoteContentTypeSchema } from './vms-project-note.schema'

const requiredTrimmedString = z.string().trim().min(1)

export const editNoteWithAiSchema = z.object({
  command: requiredTrimmedString.max(2000),
  content: z.string().max(80_000),
  contentType: projectNoteContentTypeSchema,
})

export const aiEditedNoteSchema = z.object({
  content: z.string().max(80_000),
  summary: z.string().trim().max(500).optional(),
})

export type EditNoteWithAiInput = z.infer<typeof editNoteWithAiSchema>
export type AiEditedNote = z.infer<typeof aiEditedNoteSchema>
