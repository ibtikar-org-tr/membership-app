import { z } from 'zod'

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional()

const optionalStringArray = z
  .array(z.string().trim().min(1))
  .min(1)
  .optional()

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/

export const registrationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),

  enName: z.string().trim().min(2).max(120),
  arName: z.string().trim().min(2).max(120),
  phoneNumber: optionalTrimmedString,
  sex: z.enum(['male', 'female']).optional(),
  dateOfBirth: z.string().regex(dateOnlyRegex, 'Use YYYY-MM-DD format').optional(),
  country: z.string().trim().toUpperCase().length(2).optional(),
  region: optionalTrimmedString,
  city: optionalTrimmedString,
  address: optionalTrimmedString,
  educationLevel: optionalTrimmedString,
  school: optionalTrimmedString,
  fieldOfStudy: optionalTrimmedString,
  graduationYear: z.number().int().min(1950).max(2100).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  socialMediaLinks: z.record(z.string().trim(), z.string().trim().url()).optional(),
  biography: optionalTrimmedString,
  interests: optionalStringArray,
  skills: optionalStringArray,
  languages: optionalStringArray,

  whereHeardAboutUs: optionalTrimmedString,
  motivationLetter: optionalTrimmedString,
  friendsOnPlatform: optionalStringArray,
  interestInVolunteering: optionalTrimmedString,
  previousExperience: optionalTrimmedString,
})

export type RegistrationInput = z.infer<typeof registrationSchema>
