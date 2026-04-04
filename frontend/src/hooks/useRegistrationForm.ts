import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  initialRegistrationFormData,
} from '../types/registration'
import type { FormFieldName, RegistrationFormData } from '../types/registration'

const DRAFT_STORAGE_KEY = 'registration-form-draft-v1'
const AUTOSAVE_STORAGE_KEY = 'registration-form-autosave-v1'
const MEMBER_MS_BASE_URL = (import.meta.env.VITE_MEMBER_MS as string | undefined)?.trim()
const REGISTRATION_ENDPOINT = MEMBER_MS_BASE_URL
  ? `${MEMBER_MS_BASE_URL.replace(/\/+$/, '')}/api/registration`
  : '/ms/membership-app/api/registration'
const ALLOWED_SEX_VALUES = new Set(['male', 'female'])
const ALLOWED_BLOOD_TYPES = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])

function toOptionalTrimmedString(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function toOptionalStringArray(value: string) {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? items : undefined
}

function toOptionalSocialMediaLinks(value: string) {
  if (!value.trim()) {
    return undefined
  }

  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return undefined
    }

    const links = Object.entries(parsed).reduce<Record<string, string>>((acc, [key, raw]) => {
      if (typeof raw === 'string') {
        const normalizedUrl = raw.trim()
        if (normalizedUrl) {
          acc[key] = normalizedUrl
        }
        return acc
      }

      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const label = 'label' in raw && typeof raw.label === 'string' ? raw.label.trim() : ''
        const url = 'url' in raw && typeof raw.url === 'string' ? raw.url.trim() : ''
        if (url) {
          const normalizedKey = label || key
          acc[normalizedKey] = url
        }
      }

      return acc
    }, {})

    return Object.keys(links).length > 0 ? links : undefined
  } catch {
    return undefined
  }
}

function toRegistrationPayload(formData: RegistrationFormData) {
  const graduationYear = Number.parseInt(formData.graduationYear.trim(), 10)
  const normalizedSex = formData.sex.trim()
  const normalizedBloodType = formData.bloodType.trim().toUpperCase()

  return {
    email: formData.email.trim().toLowerCase(),
    enName: formData.enName.trim(),
    arName: formData.arName.trim(),
    phoneNumber: toOptionalTrimmedString(formData.phoneNumber),
    sex: ALLOWED_SEX_VALUES.has(normalizedSex) ? normalizedSex : undefined,
    dateOfBirth: toOptionalTrimmedString(formData.dateOfBirth),
    country: toOptionalTrimmedString(formData.country)?.toUpperCase(),
    city: toOptionalTrimmedString(formData.city),
    address: toOptionalTrimmedString(formData.address),
    educationLevel: toOptionalTrimmedString(formData.educationLevel),
    school: toOptionalTrimmedString(formData.school),
    graduationYear: Number.isFinite(graduationYear) ? graduationYear : undefined,
    fieldOfStudy: toOptionalTrimmedString(formData.fieldOfStudy),
    bloodType: ALLOWED_BLOOD_TYPES.has(normalizedBloodType) ? normalizedBloodType : undefined,
    socialMediaLinks: toOptionalSocialMediaLinks(formData.socialMediaLinks),
    biography: undefined,
    interests: toOptionalStringArray(formData.interests),
    skills: toOptionalStringArray(formData.skills),
    languages: toOptionalStringArray(formData.languages),
    whereHeardAboutUs: toOptionalTrimmedString(formData.whereHeardAboutUs),
    motivationLetter: toOptionalTrimmedString(formData.motivationLetter),
    friendsOnPlatform: toOptionalStringArray(formData.friendsOnPlatform),
    interestInVolunteering: toOptionalTrimmedString(formData.interestInVolunteering),
    previousExperience: toOptionalTrimmedString(formData.previousExperience),
  }
}

export function useRegistrationForm() {
  const [formData, setFormData] = useState<RegistrationFormData>(initialRegistrationFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null)
  const [isAutosaveEnabled, setIsAutosaveEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true
    }

    const savedPreference = window.localStorage.getItem(AUTOSAVE_STORAGE_KEY)
    if (savedPreference === null) {
      return true
    }

    return savedPreference === 'true'
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !isAutosaveEnabled) {
      return
    }

    const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY)

    if (!savedDraft) {
      return
    }

    try {
      const parsedDraft = JSON.parse(savedDraft) as RegistrationFormData
      setFormData(parsedDraft)
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [isAutosaveEnabled])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(AUTOSAVE_STORAGE_KEY, String(isAutosaveEnabled))

    if (!isAutosaveEnabled) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData))
  }, [formData, isAutosaveEnabled])

  const updateField = (field: FormFieldName, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSubmitError(null)
    setSubmitSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const payload = toRegistrationPayload(formData)
      const response = await fetch(REGISTRATION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const responseBody = (await response.json().catch(() => null)) as {
        message?: string
        error?: string
      } | null

      if (!response.ok) {
        setSubmitError(responseBody?.error ?? 'تعذّر إرسال الطلب. يرجى المحاولة مرة أخرى.')
        return
      }

      setSubmitSuccessMessage(responseBody?.message ?? 'تم إرسال طلب التسجيل بنجاح.')
      setFormData(initialRegistrationFormData)

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      }
    } catch {
      setSubmitError('تعذّر الاتصال بالخادم. تحقّق من الشبكة ثم حاول مجددًا.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAutosave = () => {
    setIsAutosaveEnabled((current) => !current)
  }

  return {
    formData,
    isSubmitting,
    submitError,
    submitSuccessMessage,
    isAutosaveEnabled,
    updateField,
    handleSubmit,
    toggleAutosave,
  }
}
