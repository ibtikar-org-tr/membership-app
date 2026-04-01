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
    <SectionCard title="Education" subtitle="Academic background and field of study.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="education-level"
          label="Education Level"
          options={educationLevelOptions}
          value={data.educationLevel}
          onChange={(value) => onFieldChange('educationLevel', value)}
        />
        <TextField
          id="graduation-year"
          label="Graduation Year"
          type="number"
          value={data.graduationYear}
          onChange={(value) => onFieldChange('graduationYear', value)}
        />
        <TextField
          id="school"
          label="School"
          value={data.school}
          onChange={(value) => onFieldChange('school', value)}
        />
        <TextField
          id="field-of-study"
          label="Field of Study"
          value={data.fieldOfStudy}
          onChange={(value) => onFieldChange('fieldOfStudy', value)}
        />
      </div>
    </SectionCard>
  )
}
