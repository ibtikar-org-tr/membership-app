import { SelectField } from '../components/SelectField'
import { SectionCard } from '../components/SectionCard'
import { TextField } from '../components/TextField'
import { countryOptions, sexOptions } from '../config/registrationOptions'
import type { RegistrationFormData } from '../types/registration'
import { PhoneInput } from 'react-international-phone'

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
    <SectionCard title="التفاصيل الشخصية" subtitle="معلومات الهوية والاتصال المطلوبة.">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          id="email"
          label="البريد الإلكتروني"
          type="email"
          value={data.email}
          onChange={(value) => onFieldChange('email', value)}
          required
        />
        <TextField
          id="en-name"
          label="الاسم بالإنجليزية"
          value={data.enName}
          onChange={(value) => onFieldChange('enName', value)}
          required
        />
        <TextField
          id="ar-name"
          label="الاسم بالعربية"
          value={data.arName}
          onChange={(value) => onFieldChange('arName', value)}
          required
        />
        <div className="md:col-span-2">
          <label htmlFor="phone-number" className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            رقم الهاتف
            <PhoneInput
              defaultCountry="tr"
              value={data.phoneNumber}
              onChange={(phone) => onFieldChange('phoneNumber', phone)}
              inputProps={{
                id: 'phone-number',
                className: 'w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100',
              }}
            />
          </label>
        </div>
        <SelectField
          id="sex"
          label="الجنس"
          options={sexOptions}
          value={data.sex}
          onChange={(value) => onFieldChange('sex', value)}
        />
        <TextField
          id="dob"
          label="تاريخ الميلاد"
          type="date"
          value={data.dateOfBirth}
          onChange={(value) => onFieldChange('dateOfBirth', value)}
        />
        <div className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 md:col-span-2 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">تفاصيل الموقع</p>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="country"
              label="الدولة"
              options={countryOptions}
              placeholder="اختر دولتك"
              value={data.country}
              onChange={handleCountryChange}
            />

            {hasCountry && (
              <TextField
                id="city"
                label="المدينة"
                value={data.city}
                onChange={(value) => onFieldChange('city', value)}
              />
            )}

            {hasCountry && hasCity && (
              <div className="md:col-span-2">
                <TextField
                  id="address"
                  label="العنوان"
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
