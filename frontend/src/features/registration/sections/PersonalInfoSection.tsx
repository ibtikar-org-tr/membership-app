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
            <div className="[&_.ric-focus]:ring-2 [&_.ric-focus]:ring-teal-100 [&_.ric-focus]:border-teal-500">
              <PhoneInput
                defaultCountry="tr"
                value={data.phoneNumber}
                onChange={(phone) => onFieldChange('phoneNumber', phone)}
                inputProps={{
                  id: 'phone-number',
                  className: 'w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100',
                }}
                countrySelectorStyleProps={{
                  buttonClassName: 'h-11 rounded-tl-xl rounded-bl-xl border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2',
                }}
              />
            </div>
          </label>
          <style>{`
            .ric-input-container {
              border-radius: 0.75rem;
              border: 1px solid #cbd5e1;
              background: white;
              display: flex;
              height: 2.75rem;
              align-items: center;
              transition: all 0.2s;
            }
            
            .ric-input-container:focus-within {
              border-color: #14b8a6;
              box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.1);
            }
            
            .ric-input {
              font-size: 0.875rem;
              color: #1e293b;
              flex: 1;
              border: none;
              outline: none;
              padding: 0 0.75rem;
              background: transparent;
            }
            
            .ric-button {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              padding: 0 0.75rem;
              border-right: 1px solid #cbd5e1;
              border: none;
              background: transparent;
              cursor: pointer;
              transition: background-color 0.2s;
              height: 100%;
            }
            
            .ric-button:hover {
              background-color: #f1f5f9;
            }
            
            .ric-button-flag {
              font-size: 1.5rem;
            }
            
            .ric-dropdown-button {
              display: flex;
              align-items: center;
              justify-content: center;
              border: none;
              background: transparent;
              cursor: pointer;
              padding: 0 0.25rem;
              color: #64748b;
            }
            
            .ric-dropdown {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              margin-top: 0.5rem;
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 0.75rem;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
              max-height: 16rem;
              overflow-y: auto;
              z-index: 50;
            }
            
            .ric-option {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 0.75rem 1rem;
              cursor: pointer;
              transition: background-color 0.15s;
              border: none;
              background: transparent;
              width: 100%;
              text-align: start;
              font-size: 0.875rem;
              color: #475569;
            }
            
            .ric-option:hover {
              background-color: #f1f5f9;
            }
            
            .ric-option.selected {
              background-color: #f0fdfa;
              color: #0d9488;
              font-weight: 500;
            }
            
            .ric-option-flag {
              font-size: 1.25rem;
              flex-shrink: 0;
            }
            
            .ric-option-name {
              flex: 1;
            }
            
            .ric-option-dial {
              color: #94a3b8;
              font-size: 0.8125rem;
            }
          `}</style>
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
