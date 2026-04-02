import { SectionCard } from '../components/SectionCard'
import { SearchableSelectField } from '../components/SearchableSelectField'
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
        <TextField
          id="graduation-year"
          label="سنة التخرج"
          type="number"
          value={data.graduationYear}
          onChange={(value) => onFieldChange('graduationYear', value)}
        />
        <TextField
          id="field-of-study"
          label="مجال الدراسة"
          value={data.fieldOfStudy}
          onChange={(value) => onFieldChange('fieldOfStudy', value)}
        />
      </div>
    </SectionCard>
  )
}
