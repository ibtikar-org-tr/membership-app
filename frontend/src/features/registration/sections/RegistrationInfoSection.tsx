import { useState } from 'react'
import { SearchableTagsField } from '../components/SearchableTagsField'
import { SelectField } from '../components/SelectField'
import { SectionCard } from '../components/SectionCard'
import { TextAreaField } from '../components/TextAreaField'
import { whereHeardAboutUsOptions, volunteeringInterestOptions, bloodTypeOptions } from '../config/registrationOptions'
import type { RegistrationFormData } from '../types/registration'

type RegistrationInfoSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

const MOTIVATION_LETTER_MIN_LENGTH = 50

export function RegistrationInfoSection({ data, onFieldChange }: RegistrationInfoSectionProps) {
  const [motivationLetterTouched, setMotivationLetterTouched] = useState(false)

  const getMotivationLetterError = () => {
    if (!motivationLetterTouched) return undefined
    if (data.motivationLetter.length < MOTIVATION_LETTER_MIN_LENGTH) {
      return `يجب أن يكون طول الرسالة 50 حرفاً على الأقل (${data.motivationLetter.length}/${MOTIVATION_LETTER_MIN_LENGTH})`
    }
    return undefined
  }

  const handleMotivationLetterChange = (value: string) => {
    setMotivationLetterTouched(true)
    onFieldChange('motivationLetter', value)
  }

  return (
    <SectionCard title="معلومات إضافيّة تهمّنا" subtitle="نسعد بالتعرّف عليكم أكثر من خلال هذه المعلومات الاختيارية.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="heard-about-us"
          label="كيف سمعت عنا؟"
          options={whereHeardAboutUsOptions}
          value={data.whereHeardAboutUs}
          onChange={(value) => onFieldChange('whereHeardAboutUs', value)}
        />
        <SearchableTagsField
          id="friends-on-platform"
          label="هل يمكنك ذكر أسماء لأشخاص تعرفهم من تجمّع إبتكار"
          placeholder="اكتب اسم الشخص ثم اضغط Enter"
          options={[]}
          helperText="اذا كان انضمامك عبر دعوة من عضو في التجمّع، يرجى ذكر اسم العضو"
          initialSuggestions={[]}
          value={data.friendsOnPlatform}
          onChange={(value) => onFieldChange('friendsOnPlatform', value)}
        />
        <div className="md:col-span-2">
          <TextAreaField
            id="motivation-letter"
            label="خطاب الدافع"
            rows={5}
            value={data.motivationLetter}
            onChange={handleMotivationLetterChange}
            helperText="لماذا ترغب في الانضمام إلى مجتمعنا؟ ما الذي تأمل في تحقيقه أو المساهمة به؟"
            error={getMotivationLetterError()}
          />
        </div>
        <SelectField
          id="volunteering-interest"
          label="الاهتمام بالتطوع"
          options={volunteeringInterestOptions}
          value={data.interestInVolunteering}
          helperText="اختر ما إذا كنت مهتمّاً بالمشاركة في الأنشطة التّطوعيّة في تجمّع إبتكار"
          onChange={(value) => onFieldChange('interestInVolunteering', value)}
        />
        {(data.interestInVolunteering === 'yes' || data.interestInVolunteering === 'maybe') && (
          <>
            <TextAreaField
              id="previous-experience"
              label="الخبرة السابقة"
              rows={3}
              value={data.previousExperience}
              onChange={(value) => onFieldChange('previousExperience', value)}
              helperText="حدّثنا عن خبراتك السابقة في التطوع"
            />
            <div className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
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
          </>
        )}
      </div>
    </SectionCard>
  )
}
