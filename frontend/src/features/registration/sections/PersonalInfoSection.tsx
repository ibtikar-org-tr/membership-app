import { SelectField } from '../components/SelectField'
import { SectionCard } from '../components/SectionCard'
import { TextField } from '../components/TextField'
import { PhoneNumberField } from '../components/PhoneNumberField'
import { EmailField } from '../components/EmailField'
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
    <SectionCard
      title="التفاصيل الشخصية"
      subtitle="معلومات الهوية والاتصال المطلوبة."
      className="z-[130]"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <EmailField
            id="email"
            label="البريد الإلكتروني"
            value={data.email}
            onChange={(value) => onFieldChange('email', value)}
            required
          />
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-900">
            تأكّد أنّك مسجّل من بريدك الالكتروني الأساسي لأننا سنتواصل معك عبر هذا الايميل
            <br />
            هام: هذا البريد الإلكتروني سوف تستخدمه في تسجيل الدخول لمنصّات التجمّع لاحقاً، وكذلك سيتمّ التواصل معك عبره، وسيكون من الصّعب تغيير لاحقاً
          </p>
        </div>
        <TextField
          id="ar-name"
          label="الاسم بالعربية"
          value={data.arName}
          onChange={(value) => onFieldChange('arName', value)}
          helperText="الاسم الكامل باللغة العربية"
          validationPattern={/^\s*[أ-يءآًٌٍَُِْ]+(?:\s*[أ-يءآًٌٍَُِْ]+)+\s*$/}
          validationMessage="يرجى كتابة الاسم الكامل باللغة العربيّة"
          required
        />
        <TextField
          id="en-name"
          label="Name Surname"
          value={data.enName}
          onChange={(value) => onFieldChange('enName', value)}
          inputDir="ltr"
          helperText="الاسم الكامل باللغة التركية أو الإنكليزية"
          validationPattern={/^\s*[a-zA-ZçÇğĞıİöÖşŞüÜ]+(?:\s+[a-zA-ZçÇğĞıİöÖşŞüÜ]+)+\s*$/}
          validationMessage="يرجى كتابة الاسم الكامل باللغة التركيّة/الإنكليزيّة"
          required
        />
        <PhoneNumberField
          value={data.phoneNumber}
          onChange={(value) => onFieldChange('phoneNumber', value)}
        />
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
