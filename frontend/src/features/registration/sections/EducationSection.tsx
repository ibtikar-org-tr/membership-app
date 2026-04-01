import { SelectField } from '../components/SelectField'
import { SectionCard } from '../components/SectionCard'
import { TextField } from '../components/TextField'
import { educationLevelOptions } from '../config/registrationOptions'
import type { RegistrationFormData } from '../types/registration'

type EducationSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

export function EducationSection({ data, onFieldChange }: EducationSectionProps) {
  return (
    <SectionCard title="التعليم" subtitle="الخلفية الأكاديمية ومادة الدراسة.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="education-level"
          label="مستوى التعليم"
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
