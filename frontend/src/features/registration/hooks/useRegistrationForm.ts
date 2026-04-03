import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  initialRegistrationFormData,
} from '../types/registration'
import type { FormFieldName, RegistrationFormData } from '../types/registration'

const DRAFT_STORAGE_KEY = 'registration-form-draft-v1'
const AUTOSAVE_STORAGE_KEY = 'registration-form-autosave-v1'

export function useRegistrationForm() {
  const [formData, setFormData] = useState<RegistrationFormData>(initialRegistrationFormData)
  const [isAutosaveEnabled, setIsAutosaveEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(AUTOSAVE_STORAGE_KEY) === 'true'
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    }

    console.log('Registration payload (frontend only):', formData)
  }

  const toggleAutosave = () => {
    setIsAutosaveEnabled((current) => !current)
  }

  return {
    formData,
    isAutosaveEnabled,
    updateField,
    handleSubmit,
    toggleAutosave,
  }
}
