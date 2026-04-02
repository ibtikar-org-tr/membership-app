import { SectionCard } from '../components/SectionCard'
import { SearchableSelectField } from '../components/SearchableSelectField'
import { SelectField } from '../components/SelectField'
import { TextField } from '../components/TextField'
import type { RegistrationFormData } from '../types/registration'

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

  return (
    <SectionCard title="التعليم" subtitle="الخلفية الأكاديمية ومادة الدراسة.">
      <div className="grid gap-4 md:grid-cols-2">
        <SearchableSelectField
          id="education-level"
          label="مستوى التعليم"
          placeholder="اختر مستوى التعليم"
          defaultAdornment={null}
          dropdownZIndex={1600}
          options={educationLevelOptions}
          value={data.educationLevel}
          onChange={(value) => onFieldChange('educationLevel', value)}
        />
        <TextField
          id="school"
          label="المدرسة أو الجامعة"
          value={data.school}
          onChange={(value) => onFieldChange('school', value)}
        />
        <SelectField
          id="graduation-year"
          label="سنة التخرج"
          placeholder="اختر سنة التخرج"
          helperText="السنة التي تخرجت فيها أو تتوقع التخرج فيها."
          options={graduationYearOptions}
          value={data.graduationYear}
          onChange={(value) => onFieldChange('graduationYear', value)}
        />
        <TextField
          id="field-of-study"
          label="الفرع الدراسي"
          value={data.fieldOfStudy}
          onChange={(value) => onFieldChange('fieldOfStudy', value)}
          helperText='الفرع الجامعي أو التخصص في المدرسة'
        />
      </div>
    </SectionCard>
  )
}
