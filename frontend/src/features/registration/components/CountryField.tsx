import { useEffect, useMemo, useRef, useState } from 'react'
import { defaultCountries, parseCountry } from 'react-international-phone'
import type { CountryIso2 } from 'react-international-phone'
import syriaModernFlag from '../../../assets/flags/syria-modern.svg'

type CountryFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CountryField({
  id,
  label,
  value,
  onChange,
  placeholder = 'اختر دولتك',
}: CountryFieldProps) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const sourceCountries = useMemo(() => {
    return defaultCountries.map((country) => {
      const parsed = parseCountry(country)

      if (parsed.iso2 !== 'il') {
        return country
      }

      const next = [...country] as typeof country
      next[0] = 'Occupied Palestine'
      return next
    })
  }, [])

  const countries = useMemo(() => sourceCountries.map((country) => parseCountry(country)), [sourceCountries])

  const arabicCountryNames = useMemo(() => {
    const map = new Map<CountryIso2, string>()
    const displayNames =
      typeof Intl !== 'undefined' && 'DisplayNames' in Intl
        ? new Intl.DisplayNames(['ar'], { type: 'region' })
        : null

    countries.forEach((country) => {
      const regionCode = country.iso2.toUpperCase()
      const localizedName = displayNames?.of(regionCode)

      if (country.iso2 === 'il') {
        map.set(country.iso2, 'فلسطين المحتلة')
        return
      }

      map.set(country.iso2, localizedName && localizedName !== regionCode ? localizedName : country.name)
    })

    return map
  }, [countries])

  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return countries
    const isoQuery = query.replace(/[^a-z]/g, '')

    return countries.filter((country) => {
      const arabicName = (arabicCountryNames.get(country.iso2) ?? '').toLowerCase()
      const iso2 = country.iso2.toLowerCase()

      return (
        arabicName.includes(query) ||
        country.name.toLowerCase().includes(query) ||
        (isoQuery.length > 0 && iso2.includes(isoQuery)) ||
        country.dialCode.includes(query.replace('+', ''))
      )
    })
  }, [arabicCountryNames, countries, searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toFlagEmoji = (iso2: string) => {
    const codePoints = iso2
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0))

    return String.fromCodePoint(...codePoints)
  }

  const selectedIso2 = value.trim().toLowerCase() as CountryIso2
  const selectedCountry = countries.find((country) => country.iso2 === selectedIso2)
  const selectedLabel = selectedCountry
    ? (arabicCountryNames.get(selectedCountry.iso2) ?? selectedCountry.name)
    : ''

  const handleCountrySelect = (countryIso2: CountryIso2) => {
    onChange(countryIso2.toUpperCase())
    setIsDropdownOpen(false)
    setSearchQuery('')
  }

  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <div ref={shellRef} className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setIsDropdownOpen((current) => !current)}
          className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        >
          {selectedCountry ? (
            selectedCountry.iso2 === 'sy' ? (
              <img src={syriaModernFlag} alt="" className="h-[18px] w-[18px] rounded-sm object-cover" />
            ) : (
              <span className="text-base leading-none">{toFlagEmoji(selectedCountry.iso2)}</span>
            )
          ) : (
            <span className="text-base leading-none">🌍</span>
          )}
          <span dir="rtl" className={`flex-1 truncate text-right ${selectedCountry ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedCountry ? selectedLabel : placeholder}
          </span>
          <span className="text-xs text-slate-500">▾</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[70] w-[min(22rem,calc(100vw-2rem))] min-w-[18rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 p-2">
              <input
                type="text"
                dir="rtl"
                value={searchQuery}
                placeholder="ابحث عن الدولة أو الرمز أو كود الدولة (US, TR)"
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <ul className="max-h-64 overflow-y-auto py-1">
              {filteredCountries.map((country) => {
                const isSelected = country.iso2 === selectedCountry?.iso2
                const arabicName = arabicCountryNames.get(country.iso2) ?? country.name
                const isSyria = country.iso2 === 'sy'

                return (
                  <li key={country.iso2}>
                    <button
                      type="button"
                      onClick={() => handleCountrySelect(country.iso2)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                        isSelected ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
                      }`}
                    >
                      {isSyria ? (
                        <img src={syriaModernFlag} alt="" className="h-[18px] w-[18px] rounded-sm object-cover" />
                      ) : (
                        <span className="text-base leading-none">{toFlagEmoji(country.iso2)}</span>
                      )}
                      <span dir="rtl" className="flex-1 truncate text-right">
                        {arabicName}
                      </span>
                      <span className="text-xs text-slate-500">+{country.dialCode}</span>
                    </button>
                  </li>
                )
              })}

              {filteredCountries.length === 0 && (
                <li className="px-3 py-3 text-sm text-slate-500">لا توجد نتائج</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </label>
  )
}
