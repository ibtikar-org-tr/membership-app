import { SelectField } from '../components/SelectField'
import { SectionCard } from '../components/SectionCard'
import { TextField } from '../components/TextField'
import { countryOptions, sexOptions } from '../config/registrationOptions'
import type { RegistrationFormData } from '../types/registration'

type PersonalInfoSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

export function PersonalInfoSection({ data, onFieldChange }: PersonalInfoSectionProps) {
  const hasCountry = data.country.trim().length > 0
  const hasCity = data.city.trim().length > 0

  const handleCountryChange = (value: string) => {
    onFieldChange('country', value)
    if (value !== data.country) {
      onFieldChange('city', '')
      onFieldChange('address', '')
    }
  }

  return (
    <SectionCard title="Personal Details" subtitle="Required identity and contact information.">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          id="email"
          label="Email"
          type="email"
          value={data.email}
          onChange={(value) => onFieldChange('email', value)}
          required
        />
        <TextField
          id="phone-number"
          label="Phone Number"
          type="tel"
          placeholder="+905316781111"
          value={data.phoneNumber}
          onChange={(value) => onFieldChange('phoneNumber', value)}
        />
        <TextField
          id="en-name"
          label="English Name"
          value={data.enName}
          onChange={(value) => onFieldChange('enName', value)}
          required
        />
        <TextField
          id="ar-name"
          label="Arabic Name"
          value={data.arName}
          onChange={(value) => onFieldChange('arName', value)}
          required
        />
        <SelectField
          id="sex"
          label="Sex"
          options={sexOptions}
          value={data.sex}
          onChange={(value) => onFieldChange('sex', value)}
        />
        <TextField
          id="dob"
          label="Date of Birth"
          type="date"
          value={data.dateOfBirth}
          onChange={(value) => onFieldChange('dateOfBirth', value)}
        />
        <div className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 md:col-span-2 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Location Details</p>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="country"
              label="Country"
              options={countryOptions}
              placeholder="Choose your country"
              value={data.country}
              onChange={handleCountryChange}
            />

            {hasCountry && (
              <TextField
                id="city"
                label="City"
                value={data.city}
                onChange={(value) => onFieldChange('city', value)}
              />
            )}

            {hasCountry && hasCity && (
              <div className="md:col-span-2">
                <TextField
                  id="address"
                  label="Address"
                  value={data.address}
                  onChange={(value) => onFieldChange('address', value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
