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
        <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          <span>فصيلة الدم</span>
          <div className="grid grid-cols-4 gap-2">
            {bloodTypeOptions.map((option) => {
              const isSelected = data.bloodType === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onFieldChange('bloodType', isSelected ? '' : option.value)
                  }
                  className={`h-10 rounded-lg border text-sm font-semibold transition ${
                    isSelected
                      ? 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-rose-300'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`فصيلة الدم ${option.label}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
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
