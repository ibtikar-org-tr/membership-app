import type { RegistrationFormData } from '../types/registration'
import { getEmailValidationMessage } from './email'

const ALLOWED_SEX_VALUES = new Set(['male', 'female'])
export const BYLAWS_ACKNOWLEDGEMENT_REGEX = /^نعم$/

export type MissingRegistrationField = {
  fieldId: string
  label: string
}

function hasStringArrayValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean).length > 0
      }

      if (parsed && typeof parsed === 'object') {
        return Object.keys(parsed as Record<string, unknown>)
          .map((item) => item.trim())
          .filter(Boolean).length > 0
      }
    } catch {
      // fall through to CSV parsing
    }
  }

  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean).length > 0
}

export function getMissingRequiredRegistrationFields(formData: RegistrationFormData): MissingRegistrationField[] {
  const missing: MissingRegistrationField[] = []

  if (!formData.email.trim()) {
    missing.push({ fieldId: 'email', label: 'البريد الإلكتروني' })
  } else if (getEmailValidationMessage(formData.email)) {
    missing.push({ fieldId: 'email', label: 'البريد الإلكتروني (تحقق من صحة العنوان)' })
  }

  if (!formData.arName.trim()) {
    missing.push({ fieldId: 'ar-name', label: 'الاسم بالعربية' })
  }

  if (!formData.enName.trim()) {
    missing.push({ fieldId: 'en-name', label: 'الاسم بالإنكليزية أو التركية' })
  }

  if (!formData.phoneNumber.trim()) {
    missing.push({ fieldId: 'phone-number', label: 'رقم الهاتف' })
  }

  if (!ALLOWED_SEX_VALUES.has(formData.sex.trim())) {
    missing.push({ fieldId: 'sex', label: 'الجنس' })
  }

  if (!formData.country.trim()) {
    missing.push({ fieldId: 'country', label: 'الدولة' })
  }

  if (!formData.region.trim()) {
    missing.push({ fieldId: 'state', label: 'الولاية / المحافظة' })
  }

  if (!formData.educationLevel.trim()) {
    missing.push({ fieldId: 'education-level', label: 'مستوى التعليم' })
  }

  if (!formData.school.trim()) {
    missing.push({ fieldId: 'school', label: 'المدرسة أو الجامعة' })
  }

  if (!formData.fieldOfStudy.trim()) {
    missing.push({ fieldId: 'field-of-study', label: 'الفرع الدراسي' })
  }

  if (!formData.graduationYear.trim()) {
    missing.push({ fieldId: 'graduation-year', label: 'سنة التخرج' })
  }

  if (!hasStringArrayValue(formData.interests)) {
    missing.push({ fieldId: 'interests', label: 'الاهتمامات' })
  }

  if (!BYLAWS_ACKNOWLEDGEMENT_REGEX.test(formData.bylawsAcknowledgement)) {
    missing.push({ fieldId: 'bylaws-acknowledgement', label: 'إقرار الالتزام بالنظام الداخلي' })
  }

  return missing
}

export function formatMissingRegistrationFieldsMessage(missingFields: MissingRegistrationField[]) {
  if (missingFields.length === 0) {
    return null
  }

  if (missingFields.length === 1) {
    return `يرجى تعبئة الحقل التالي: ${missingFields[0].label}.`
  }

  return `يرجى تعبئة الحقول التالية:\n${missingFields.map((field) => `• ${field.label}`).join('\n')}`
}

export function validateRequiredFields(formData: RegistrationFormData) {
  return formatMissingRegistrationFieldsMessage(getMissingRequiredRegistrationFields(formData))
}

export function scrollToRegistrationField(fieldId: string) {
  const element = document.getElementById(fieldId)
  if (!element) {
    return
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })

  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
    element.focus({ preventScroll: true })
  }
}
