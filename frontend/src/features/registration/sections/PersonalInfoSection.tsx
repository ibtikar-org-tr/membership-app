import { useEffect, useMemo, useState } from 'react'
import { GetCountries, GetState, GetCity } from 'react-country-state-city'
import type { Country, State, City } from 'react-country-state-city/dist/esm/types'
import { SectionCard } from '../components/SectionCard'
import { TextField } from '../components/TextField'
import { PhoneNumberField } from '../components/PhoneNumberField'
import { EmailField } from '../components/EmailField'
import { BirthDateField } from '../components/BirthDateField'
import type { RegistrationFormData } from '../types/registration'

type PersonalInfoSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

export function PersonalInfoSection({ data, onFieldChange }: PersonalInfoSectionProps) {
  const [selectedCountryId, setSelectedCountryId] = useState<number>(0)
  const [selectedStateId, setSelectedStateId] = useState<number>(0)
  const [countrySearch, setCountrySearch] = useState('')
  const [stateSearch, setStateSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const hasCountry = data.country.trim().length > 0
  const hasCity = data.city.trim().length > 0

  const arabicRegionNames = useMemo(() => {
    return typeof Intl !== 'undefined' && 'DisplayNames' in Intl
      ? new Intl.DisplayNames(['ar'], { type: 'region' })
      : null
  }, [])

  useEffect(() => {
    let isActive = true

    GetCountries().then((nextCountries) => {
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

    GetState(selectedCountryId).then((nextStates) => {
      if (!isActive) return
      setStates(nextStates)
    })

    return () => {
      isActive = false
    }
  }, [selectedCountryId])

  useEffect(() => {
    let isActive = true

    if (!selectedCountryId || !selectedStateId) {
      setCities([])
      return
    }

    GetCity(selectedCountryId, selectedStateId).then((nextCities) => {
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
      onFieldChange('city', '')
      onFieldChange('address', '')
    }
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountryId(country.id)
    setSelectedStateId(0)
    setStateSearch('')
    setCitySearch('')
    handleCountryChange(country.iso2.toUpperCase())
  }

  const handleStateSelect = (state: State) => {
    setSelectedStateId(state.id)
    setCitySearch('')
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
  const selectedState = states.find((state) => state.id === selectedStateId)

  useEffect(() => {
    if (!selectedCountry) {
      return
    }

    setCountrySearch(`${selectedCountry.emoji} ${getArabicCountryName(selectedCountry)}`)
  }, [selectedCountry])

  useEffect(() => {
    if (!selectedState) {
      return
    }

    setStateSearch(selectedState.name)
  }, [selectedState])

  useEffect(() => {
    if (!data.city) {
      return
    }

    setCitySearch(data.city)
  }, [data.city])

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
        <div className="text-left">
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
        />
        <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          <span>الجنس</span>
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
          required
        />
        <div className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 md:col-span-2 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">تفاصيل الموقع</p>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              الدولة
              <input
                type="text"
                list="country-options"
                value={countrySearch}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setCountrySearch(nextValue)

                  if (nextValue.trim() === '') {
                    setSelectedCountryId(0)
                    setSelectedStateId(0)
                    setStateSearch('')
                    setCitySearch('')
                    handleCountryChange('')
                    return
                  }

                  const normalized = nextValue.trim().toLowerCase()
                  const country = countries.find((item) => {
                    const arabicName = getArabicCountryName(item).toLowerCase()
                    const withEmoji = `${item.emoji} ${getArabicCountryName(item)}`.toLowerCase()
                    return arabicName === normalized || withEmoji === normalized
                  })
                  if (country) {
                    handleCountrySelect(country)
                  }
                }}
                placeholder="ابحث واختر دولتك"
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                dir="rtl"
              />
              <datalist id="country-options">
                {countries.map((country) => (
                  <option key={country.id} value={`${country.emoji} ${getArabicCountryName(country)}`} />
                ))}
              </datalist>
            </label>

            {selectedCountryId > 0 && (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                الولاية / المحافظة
                <input
                  type="text"
                  list="state-options"
                  value={stateSearch}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setStateSearch(nextValue)

                    if (nextValue.trim() === '') {
                      setSelectedStateId(0)
                      setCitySearch('')
                      onFieldChange('city', '')
                      onFieldChange('address', '')
                      return
                    }

                    const normalized = nextValue.trim().toLowerCase()
                    const state = states.find((item) => item.name.toLowerCase() === normalized)
                    if (state) {
                      handleStateSelect(state)
                    }
                  }}
                  placeholder="ابحث واختر الولاية / المحافظة"
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  dir="rtl"
                />
                <datalist id="state-options">
                  {states.map((state) => (
                    <option key={state.id} value={state.name} />
                  ))}
                </datalist>
              </label>
            )}

            {selectedCountryId > 0 && selectedStateId > 0 && (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                المدينة
                <input
                  type="text"
                  list="city-options"
                  value={citySearch}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setCitySearch(nextValue)

                    if (nextValue.trim() === '') {
                      onFieldChange('city', '')
                      return
                    }

                    const normalized = nextValue.trim().toLowerCase()
                    const city = cities.find((item) => item.name.toLowerCase() === normalized)
                    if (city) {
                      handleCitySelect(city)
                    }
                  }}
                  placeholder="ابحث واختر المدينة"
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  dir="rtl"
                />
                <datalist id="city-options">
                  {cities.map((city) => (
                    <option key={city.id} value={city.name} />
                  ))}
                </datalist>
              </label>
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
