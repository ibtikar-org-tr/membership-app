import { useEffect, useMemo, useState } from 'react'
import type { Country, State, City } from 'react-country-state-city/dist/esm/types'
import { SectionCard } from '../SectionCard'
import { TextField } from '../TextField'
import { PhoneNumberField } from './personal-info-section/PhoneNumberField'
import { EmailField } from './personal-info-section/EmailField'
import { BirthDateField } from './personal-info-section/BirthDateField'
import { SearchableSelectField } from '../SearchableSelectField'
import syriaModernFlag from '@assets/flags/syria-modern.svg'
import type { RegistrationFormData } from '../../../types/registration'

const countryStateCityModulePromise = import('react-country-state-city')

type PersonalInfoSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
  readOnlyFields?: Set<string>
}

export function PersonalInfoSection({ data, onFieldChange, readOnlyFields }: PersonalInfoSectionProps) {
  const [selectedCountryId, setSelectedCountryId] = useState<number>(0)
  const [selectedStateId, setSelectedStateId] = useState<number>(0)
  const [showAddressField, setShowAddressField] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const hasCity = data.city.trim().length > 0

  const arabicRegionNames = useMemo(() => {
    return typeof Intl !== 'undefined' && 'DisplayNames' in Intl
      ? new Intl.DisplayNames(['ar'], { type: 'region' })
      : null
  }, [])

  useEffect(() => {
    let isActive = true

    countryStateCityModulePromise.then(({ GetCountries }) => GetCountries()).then((nextCountries) => {
      if (!isActive) return
      setCountries(nextCountries)
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (selectedCountryId > 0) {
      return
    }

    const iso2 = data.country.trim().toLowerCase()
    if (!iso2 || countries.length === 0) {
      return
    }

    const matchedCountry = countries.find((country) => country.iso2.toLowerCase() === iso2)
    if (matchedCountry) {
      setSelectedCountryId(matchedCountry.id)
    }
  }, [countries, data.country, selectedCountryId])

  useEffect(() => {
    let isActive = true

    if (!selectedCountryId) {
      setStates([])
      setCities([])
      return
    }

    countryStateCityModulePromise.then(({ GetState }) => GetState(selectedCountryId)).then((nextStates) => {
      if (!isActive) return
      setStates(nextStates)
    })

    return () => {
      isActive = false
    }
  }, [selectedCountryId])

  useEffect(() => {
    if (selectedStateId > 0) {
      return
    }

    const regionName = data.region.trim().toLowerCase()
    if (!regionName || states.length === 0) {
      return
    }

    const matchedState = states.find((state) => state.name.trim().toLowerCase() === regionName)
    if (matchedState) {
      setSelectedStateId(matchedState.id)
    }
  }, [data.region, selectedStateId, states])

  useEffect(() => {
    let isActive = true

    if (!selectedCountryId || !selectedStateId) {
      setCities([])
      return
    }

    countryStateCityModulePromise
      .then(({ GetCity }) => GetCity(selectedCountryId, selectedStateId))
      .then((nextCities) => {
        if (!isActive) return
        setCities(nextCities)
      })

    return () => {
      isActive = false
    }
  }, [selectedCountryId, selectedStateId])

  const handleCountryChange = (value: string) => {
    onFieldChange('country', value)
    if (value !== data.country) {
      setShowAddressField(false)
      onFieldChange('region', '')
      onFieldChange('city', '')
      onFieldChange('address', '')
    }
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountryId(country.id)
    setSelectedStateId(0)
    handleCountryChange(country.iso2.toUpperCase())
  }

  const handleStateSelect = (state: State) => {
    setSelectedStateId(state.id)
    setShowAddressField(false)
    onFieldChange('region', state.name)
    onFieldChange('city', '')
    onFieldChange('address', '')
  }

  const handleCitySelect = (city: City) => {
    onFieldChange('city', city.name)
  }

  const getArabicCountryName = (country: Country) => {
    if (country.iso2.toLowerCase() === 'il') {
      return 'فلسطين المحتلة'
    }

    const localizedName = arabicRegionNames?.of(country.iso2.toUpperCase())
    return localizedName && localizedName !== country.iso2.toUpperCase() ? localizedName : country.name
  }

  const selectedCountry = countries.find((country) => country.id === selectedCountryId)

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: String(country.id),
        label: getArabicCountryName(country),
        leftAdornment:
          country.iso2.toLowerCase() === 'sy' ? (
            <img src={syriaModernFlag} alt="" className="h-4.5 w-4.5 rounded-sm object-cover" />
          ) : (
            country.emoji
          ),
        rightAdornment: `+${country.phone_code}`,
        searchText: `${country.name} ${country.iso2} ${country.iso3} ${country.phone_code}`,
      })),
    [countries, arabicRegionNames],
  )

  const stateOptions = useMemo(
    () =>
      states.map((state) => ({
        value: String(state.id),
        label: state.name,
        searchText: state.state_code,
      })),
    [states],
  )

  const cityOptions = useMemo(
    () =>
      cities.map((city) => ({
        value: city.name,
        label: city.name,
      })),
    [cities],
  )

  return (
    <SectionCard
      title="التفاصيل الشخصية"
      subtitle="معلومات الهوية والاتصال المطلوبة."
      className="z-130"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-2 md:col-span-2">
          <EmailField
            id="email"
            label="البريد الإلكتروني"
            value={data.email}
            onChange={(value) => onFieldChange('email', value)}
            required
            readOnly={readOnlyFields?.has('email')}
          />
          {readOnlyFields?.has('email') ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-900 wrap-break-word">
              هذا الحقل غير قابل للتعديل. إذا كنت بحاجة لتغيير البريد الإلكتروني، يرجى التواصل مع الإدارة.
            </p>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-900 wrap-break-word">
              تأكّد أنّك مسجّل من بريدك الالكتروني الأساسي لأننا سنتواصل معك عبر هذا الايميل
              <br />
              هام: هذا البريد الإلكتروني سوف تستخدمه في تسجيل الدخول لمنصّات التجمّع لاحقاً، وكذلك سيتمّ التواصل معك عبره، وسيكون من الصّعب تغيير لاحقاً
            </p>
          )}
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
        <div className="min-w-0 text-left">
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
        </div>
        <PhoneNumberField
          value={data.phoneNumber}
          onChange={(value) => onFieldChange('phoneNumber', value)}
          required
        />
        <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          <span>
            الجنس
            <span className="mr-1 font-bold text-red-600" aria-hidden="true">*</span>
          </span>
          <input
            tabIndex={-1}
            aria-hidden="true"
            value={data.sex}
            onChange={() => undefined}
            required
            className="sr-only"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onFieldChange('sex', 'male')}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl border transition ${
                data.sex === 'male'
                  ? 'border-sky-400 bg-sky-50 text-sky-700'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-sky-300'
              }`}
              aria-pressed={data.sex === 'male'}
              aria-label="ذكر"
            >
              <span className="rounded-full bg-sky-100 p-1 text-sky-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="7.5" r="3.2" />
                  <path d="M6 19.5c0-3.3 2.8-5.7 6-5.7s6 2.4 6 5.7" />
                  <path d="M12 13.8l-1.6 2.2 1.6 2.2 1.6-2.2-1.6-2.2z" />
                </svg>
              </span>
              <span>ذكر</span>
            </button>

            <button
              type="button"
              onClick={() => onFieldChange('sex', 'female')}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl border transition ${
                data.sex === 'female'
                  ? 'border-pink-400 bg-pink-50 text-pink-700'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-pink-300'
              }`}
              aria-pressed={data.sex === 'female'}
              aria-label="أنثى"
            >
              <span className="rounded-full bg-pink-100 p-1 text-pink-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="7.5" r="3.2" />
                  <path d="M7.3 8.3c.4-2.6 2.3-4.3 4.7-4.3s4.3 1.7 4.7 4.3" />
                  <path d="M6.2 19.5c.5-2.8 2.8-4.7 5.8-4.7s5.3 1.9 5.8 4.7" />
                  <path d="M9.2 14.8h5.6" />
                </svg>
              </span>
              <span>أنثى</span>
            </button>
          </div>
        </div>
        <BirthDateField
          id="dob"
          label="تاريخ الميلاد"
          value={data.dateOfBirth}
          onChange={(value) => onFieldChange('dateOfBirth', value)}
        />
        <div className="min-w-0 space-y-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 md:col-span-2 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">تفاصيل الموقع</p>

          <div className="grid gap-4 md:grid-cols-2">
            <SearchableSelectField
              id="country"
              label="الدولة"
              required
              placeholder="ابحث واختر دولتك"
              value={selectedCountry ? String(selectedCountry.id) : ''}
              options={countryOptions}
              onChange={(nextValue) => {
                if (!nextValue) {
                  setSelectedCountryId(0)
                  setSelectedStateId(0)
                  handleCountryChange('')
                  return
                }

                const country = countries.find((item) => String(item.id) === nextValue)
                if (country) {
                  handleCountrySelect(country)
                }
              }}
            />

            {selectedCountryId > 0 && (
              <SearchableSelectField
                id="state"
                label="الولاية / المحافظة"
                required
                placeholder="ابحث واختر الولاية / المحافظة"
                value={selectedStateId ? String(selectedStateId) : ''}
                options={stateOptions}
                onChange={(nextValue) => {
                  if (!nextValue) {
                    setSelectedStateId(0)
                    onFieldChange('region', '')
                    onFieldChange('city', '')
                    onFieldChange('address', '')
                    return
                  }

                  const state = states.find((item) => String(item.id) === nextValue)
                  if (state) {
                    handleStateSelect(state)
                  }
                }}
              />
            )}

            {selectedCountryId > 0 && selectedStateId > 0 && (
              <SearchableSelectField
                id="city"
                label="المدينة"
                placeholder="ابحث واختر المدينة"
                value={data.city}
                options={cityOptions}
                onChange={(nextValue) => {
                  if (!nextValue) {
                    setShowAddressField(false)
                    onFieldChange('city', '')
                    onFieldChange('address', '')
                    return
                  }

                  const city = cities.find((item) => item.name === nextValue)
                  if (city) {
                    handleCitySelect(city)
                  }
                }}
              />
            )}

            {selectedCountryId > 0 && selectedStateId > 0 && (
              <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span className="opacity-50">العنوان (اختياري)</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasCity) {
                      return
                    }

                    setShowAddressField((current) => {
                      const next = !current
                      if (!next) {
                        onFieldChange('address', '')
                      }
                      return next
                    })
                  }}
                  className="h-8 w-fit rounded-md border border-slate-300 px-2 text-xs text-slate-700 opacity-50 transition hover:opacity-80 disabled:cursor-not-allowed"
                  disabled={!hasCity}
                >
                  {showAddressField ? 'إخفاء العنوان' : 'إضافة عنوان'}
                </button>
              </div>
            )}

            {showAddressField && hasCity && (
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
