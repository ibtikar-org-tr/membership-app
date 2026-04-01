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
    <SectionCard title="Profile & Social" subtitle="Bio, links, health and communication preferences.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="blood-type"
          label="Blood Type"
          options={bloodTypeOptions}
          value={data.bloodType}
          onChange={(value) => onFieldChange('bloodType', value)}
        />
        <TextField
          id="profile-picture-url"
          label="Profile Picture URL"
          type="url"
          value={data.profilePictureUrl}
          onChange={(value) => onFieldChange('profilePictureUrl', value)}
        />
        <TextField
          id="telegram-id"
          label="Telegram ID"
          value={data.telegramId}
          onChange={(value) => onFieldChange('telegramId', value)}
        />
        <TextField
          id="telegram-username"
          label="Telegram Username"
          value={data.telegramUsername}
          onChange={(value) => onFieldChange('telegramUsername', value)}
        />
        <div className="md:col-span-2">
          <TextAreaField
            id="social-media-links"
            label="Social Media Links (JSON)"
            placeholder='{"github": "https://...", "linkedin": "https://..."}'
            rows={3}
            value={data.socialMediaLinks}
            onChange={(value) => onFieldChange('socialMediaLinks', value)}
          />
        </div>
        <div className="md:col-span-2">
          <TextAreaField
            id="biography"
            label="Biography"
            rows={4}
            value={data.biography}
            onChange={(value) => onFieldChange('biography', value)}
          />
        </div>
        <TextAreaField
          id="interests"
          label="Interests (comma-separated)"
          rows={3}
          value={data.interests}
          onChange={(value) => onFieldChange('interests', value)}
        />
        <TextAreaField
          id="skills"
          label="Skills (comma-separated)"
          rows={3}
          value={data.skills}
          onChange={(value) => onFieldChange('skills', value)}
        />
        <div className="md:col-span-2">
          <TextAreaField
            id="languages"
            label="Languages (comma-separated)"
            rows={3}
            value={data.languages}
            onChange={(value) => onFieldChange('languages', value)}
          />
        </div>
      </div>
    </SectionCard>
  )
}
