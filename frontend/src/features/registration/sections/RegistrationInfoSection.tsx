import { useState } from 'react'
import { SelectField } from '../components/SelectField'
import { SectionCard } from '../components/SectionCard'
import { TextAreaField } from '../components/TextAreaField'
import { whereHeardAboutUsOptions, volunteeringInterestOptions } from '../config/registrationOptions'
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
    <SectionCard title="تسجيل المجتمع" subtitle="دافعيتك وتفضيلات المشاركة.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="heard-about-us"
          label="كيف سمعت عنا؟"
          options={whereHeardAboutUsOptions}
          value={data.whereHeardAboutUs}
          onChange={(value) => onFieldChange('whereHeardAboutUs', value)}
        />
        <TextAreaField
          id="friends-on-platform"
          label="أصدقاء على المنصة"
          placeholder="membership_1, membership_2"
          rows={3}
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
        {data.interestInVolunteering !== 'no' && (
          <TextAreaField
            id="previous-experience"
            label="الخبرة السابقة"
            rows={3}
            value={data.previousExperience}
            onChange={(value) => onFieldChange('previousExperience', value)}
            helperText="حدّثنا عن خبراتك السابقة في التطوع"
          />
        )}
      </div>
    </SectionCard>
  )
}
