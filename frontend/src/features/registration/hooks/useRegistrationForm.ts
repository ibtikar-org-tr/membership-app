import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  initialRegistrationFormData,
} from '../types/registration'
import type { FormFieldName, RegistrationFormData } from '../types/registration'

export function useRegistrationForm() {
  const [formData, setFormData] = useState<RegistrationFormData>(initialRegistrationFormData)

  const updateField = (field: FormFieldName, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log('Registration payload (frontend only):', formData)
  }

  return {
    formData,
    updateField,
    handleSubmit,
  }
}
