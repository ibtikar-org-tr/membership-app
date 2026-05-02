import { useEffect, useMemo, useState } from 'react'
import type { Country, State, City } from 'react-country-state-city/dist/esm/types'
import { TextField } from '../../TextField'
import { SearchableSelectField } from '../../SearchableSelectField'
import syriaModernFlag from '@assets/flags/syria-modern.svg'
import type { RegistrationFormData } from '../../../../types/registration'

const countryStateCityModulePromise = import('react-country-state-city')

type LocationDetailsComponentProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

export function LocationDetailsComponent({ data, onFieldChange }: LocationDetailsComponentProps) {
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
  )
}
