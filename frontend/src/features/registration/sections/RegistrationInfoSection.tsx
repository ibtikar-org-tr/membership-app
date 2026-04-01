import { SelectField } from '../components/SelectField'
import { SectionCard } from '../components/SectionCard'
import { TextAreaField } from '../components/TextAreaField'
import { whereHeardAboutUsOptions, volunteeringInterestOptions } from '../config/registrationOptions'
import type { RegistrationFormData } from '../types/registration'

type RegistrationInfoSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

export function RegistrationInfoSection({ data, onFieldChange }: RegistrationInfoSectionProps) {
  return (
    <SectionCard title="Community Registration" subtitle="Your motivation and engagement preferences.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="heard-about-us"
          label="Where did you hear about us?"
          options={whereHeardAboutUsOptions}
          value={data.whereHeardAboutUs}
          onChange={(value) => onFieldChange('whereHeardAboutUs', value)}
        />
        <SelectField
          id="volunteering-interest"
          label="Interest in Volunteering"
          options={volunteeringInterestOptions}
          value={data.interestInVolunteering}
          onChange={(value) => onFieldChange('interestInVolunteering', value)}
        />
        <div className="md:col-span-2">
          <TextAreaField
            id="motivation-letter"
            label="Motivation Letter"
            rows={5}
            value={data.motivationLetter}
            onChange={(value) => onFieldChange('motivationLetter', value)}
          />
        </div>
        <TextAreaField
          id="friends-on-platform"
          label="Friends on Platform"
          placeholder="membership_1, membership_2"
          rows={3}
          value={data.friendsOnPlatform}
          onChange={(value) => onFieldChange('friendsOnPlatform', value)}
        />
        <TextAreaField
          id="previous-experience"
          label="Previous Experience"
          rows={3}
          value={data.previousExperience}
          onChange={(value) => onFieldChange('previousExperience', value)}
        />
      </div>
    </SectionCard>
  )
}
