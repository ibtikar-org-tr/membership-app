import { SelectField } from '../components/SelectField'
import { SectionCard } from '../components/SectionCard'
import { TextAreaField } from '../components/TextAreaField'
import { TextField } from '../components/TextField'
import { bloodTypeOptions } from '../config/registrationOptions'
import type { RegistrationFormData } from '../types/registration'

type ProfileSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

export function ProfileSection({ data, onFieldChange }: ProfileSectionProps) {
  return (
    <SectionCard title="الملف الشخصي والبيانات" subtitle="السيرة الذاتية والروابط والبيانات الصحية.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="blood-type"
          label="فصيلة الدم"
          options={bloodTypeOptions}
          value={data.bloodType}
          onChange={(value) => onFieldChange('bloodType', value)}
        />
        <div className="md:col-span-2">
          <TextAreaField
            id="social-media-links"
            label="روابط وسائل التواصل (JSON)"
            placeholder='{"github": "https://...", "linkedin": "https://..."}'
            rows={3}
            value={data.socialMediaLinks}
            onChange={(value) => onFieldChange('socialMediaLinks', value)}
          />
        </div>
        <div className="md:col-span-2">
          <TextAreaField
            id="biography"
            label="السيرة الذاتية"
            rows={4}
            value={data.biography}
            onChange={(value) => onFieldChange('biography', value)}
          />
        </div>
        <TextAreaField
          id="interests"
          label="الاهتمامات (مفصولة بفواصل)"
          rows={3}
          value={data.interests}
          onChange={(value) => onFieldChange('interests', value)}
        />
        <TextAreaField
          id="skills"
          label="المهارات (مفصولة بفواصل)"
          rows={3}
          value={data.skills}
          onChange={(value) => onFieldChange('skills', value)}
        />
        <div className="md:col-span-2">
          <TextAreaField
            id="languages"
            label="اللغات (مفصولة بفواصل)"
            rows={3}
            value={data.languages}
            onChange={(value) => onFieldChange('languages', value)}
          />
        </div>
      </div>
    </SectionCard>
  )
}
