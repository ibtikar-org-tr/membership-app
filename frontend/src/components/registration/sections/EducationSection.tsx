import { SectionCard } from '../SectionCard'
import { SearchableSelectField } from '../SearchableSelectField'
import { SelectField } from '../SelectField'
import { TextField } from '../TextField'
import type { RegistrationFormData } from '../../../types/registration'

type EducationSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

export function EducationSection({ data, onFieldChange }: EducationSectionProps) {
  const educationLevelOptions = [
    { value: 'high_school', label: 'ثانوية', secondaryLabel: 'مدرسة' },
    { value: 'diploma', label: 'دبلوم', secondaryLabel: 'معهد' },
    { value: 'bachelor', label: 'بكالوريوس', secondaryLabel: 'جامعة' },
    { value: 'master', label: 'ماجستير', secondaryLabel: 'دراسات عليا' },
    { value: 'phd', label: 'دكتوراه', secondaryLabel: 'دراسات عليا' },
    { value: 'other', label: 'أخرى' },
  ]

  const graduationYearOptions = Array.from({ length: 2033 - 2010 + 1 }, (_, index) => {
    const year = String(2033 - index)
    return { value: year, label: year }
  })

  const hasEducationLevel = data.educationLevel.trim().length > 0
  const isSchoolTrack = data.educationLevel === 'high_school'

  const schoolOrUniversityLabel = hasEducationLevel
    ? (isSchoolTrack ? 'اسم المدرسة' : 'اسم الجامعة')
    : 'المدرسة أو الجامعة'

  const schoolOrUniversityHelperText = hasEducationLevel
    ? (isSchoolTrack ? 'اكتب اسم المدرسة.' : 'اكتب اسم الجامعة.')
    : undefined

  const graduationYearHelperText = hasEducationLevel
    ? (isSchoolTrack
      ? 'السنة التي تخرجت فيها أو تتوقع التخرج فيها من المدرسة.'
      : 'السنة التي تخرجت فيها أو تتوقع التخرج فيها من الجامعة')
    : 'السنة التي تخرجت فيها أو تتوقع التخرج فيها.'

  const fieldOfStudyLabel = hasEducationLevel ? 'الفرع الدراسي' : 'مجال الدراسة'
  const fieldOfStudyHelperText = hasEducationLevel
    ? (isSchoolTrack ? 'التخصص في المدرسة' : 'الفرع الجامعي')
    : undefined

  return (
    <SectionCard title="التعليم" subtitle="معلومات عن خلفيتك التعليمية.">
      <div className="grid gap-4 md:grid-cols-2">
        <SearchableSelectField
          id="education-level"
          label="مستوى التعليم"
          required
          placeholder="اختر مستوى التعليم"
          defaultAdornment={null}
          dropdownZIndex={1600}
          options={educationLevelOptions}
          value={data.educationLevel}
          onChange={(value) => onFieldChange('educationLevel', value)}
        />
        <TextField
          id="school"
          label={schoolOrUniversityLabel}
          value={data.school}
          onChange={(value) => onFieldChange('school', value)}
          helperText={schoolOrUniversityHelperText}
          required
        />
        <SelectField
          id="graduation-year"
          label="سنة التخرج"
          placeholder="اختر سنة التخرج"
          helperText={graduationYearHelperText}
          options={graduationYearOptions}
          value={data.graduationYear}
          onChange={(value) => onFieldChange('graduationYear', value)}
          required
        />
        <TextField
          id="field-of-study"
          label={fieldOfStudyLabel}
          value={data.fieldOfStudy}
          onChange={(value) => onFieldChange('fieldOfStudy', value)}
          helperText={fieldOfStudyHelperText}
          required
        />
      </div>
    </SectionCard>
  )
}
