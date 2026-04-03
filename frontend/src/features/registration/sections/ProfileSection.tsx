import { SectionCard } from '../components/SectionCard'
import { SearchableTagsField } from '../components/SearchableTagsField'
import { SocialMediaLinksField } from '../components/SocialMediaLinksField'
import { POPULAR_LANGUAGES_INITIAL_SUGGESTIONS, POPULAR_LANGUAGE_OPTIONS } from '../config/languages.ts'
import { bloodTypeOptions } from '../config/registrationOptions'
import { POPULAR_SKILLS, POPULAR_SKILLS_INITIAL_SUGGESTIONS } from '../config/popularSkills'
import type { RegistrationFormData } from '../types/registration'

type ProfileSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

export function ProfileSection({ data, onFieldChange }: ProfileSectionProps) {
  return (
    <SectionCard title="الملف الشخصي والبيانات" subtitle="روابط التواصل والمهارات.">
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
          <SocialMediaLinksField
            id="social-media-links"
            label="روابط وسائل التواصل"
            value={data.socialMediaLinks}
            onChange={(value) => onFieldChange('socialMediaLinks', value)}
          />
        </div>
        <SearchableTagsField
          id="skills"
          label="المهارات (التي تُتقنها)"
          value={data.skills}
          options={POPULAR_SKILLS}
          initialSuggestions={POPULAR_SKILLS_INITIAL_SUGGESTIONS}
          placeholder="ابحث عن مهارة أو أضف مهارة مخصصة"
          onChange={(value) => onFieldChange('skills', value)}
        />
        <SearchableTagsField
          id="interests"
          label="الاهتمامات (التي تودّ تعلّمها)"
          value={data.interests}
          options={POPULAR_SKILLS}
          initialSuggestions={POPULAR_SKILLS_INITIAL_SUGGESTIONS}
          placeholder="ابحث عن اهتمام أو أضف اهتمامًا مخصصًا"
          onChange={(value) => onFieldChange('interests', value)}
        />
        <div className="md:col-span-2">
          <SearchableTagsField
            id="languages"
            label="اللغات"
            value={data.languages}
            options={POPULAR_LANGUAGE_OPTIONS}
            initialSuggestions={POPULAR_LANGUAGES_INITIAL_SUGGESTIONS}
            allowCustom={false}
            placeholder="ابحث بالعربية أو English أو ISO (مثل ar, en)"
            onChange={(value) => onFieldChange('languages', value)}
          />
        </div>
      </div>
    </SectionCard>
  )
}
