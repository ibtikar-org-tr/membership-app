import { useEffect, useMemo, useRef, useState } from 'react'
import { PhoneInput, defaultCountries, parseCountry } from 'react-international-phone'
import 'react-international-phone/style.css'
import type { CountryIso2, PhoneInputRefType } from 'react-international-phone'

type PhoneNumberFieldProps = {
  value: string
  onChange: (value: string) => void
}

export function PhoneNumberField({ value, onChange }: PhoneNumberFieldProps) {
  const phoneInputRef = useRef<PhoneInputRefType>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<CountryIso2>('tr')

  const countries = useMemo(() => defaultCountries.map((country) => parseCountry(country)), [])

  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return countries

    return countries.filter((country) => {
      return (
        country.name.toLowerCase().includes(query) ||
        country.iso2.toLowerCase().includes(query) ||
        country.dialCode.includes(query.replace('+', ''))
      )
    })
  }, [countries, searchQuery])

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

  const handleCountrySelect = (countryIso2: CountryIso2) => {
    phoneInputRef.current?.setCountry(countryIso2)
    setSelectedCountry(countryIso2)
    setIsDropdownOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="md:col-span-2">
      <label htmlFor="phone-number" className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        رقم الهاتف
        <div ref={shellRef} dir="ltr" className="phone-input-shell relative">
          <PhoneInput
            ref={phoneInputRef}
            defaultCountry="tr"
            hideDropdown
            value={value}
            onChange={(phone, meta) => {
              onChange(phone)
              setSelectedCountry(meta.country.iso2)
            }}
            inputProps={{
              id: 'phone-number',
              className: 'w-full',
            }}
            countrySelectorStyleProps={{
              buttonClassName: 'pointer-events-none border-0 bg-white shadow-none',
            }}
          />

          <button
            type="button"
            aria-label="اختيار الدولة"
            onClick={() => setIsDropdownOpen((current) => !current)}
            className="absolute left-0 top-0 z-20 h-11 w-14 cursor-pointer bg-transparent"
          />

          {isDropdownOpen && (
            <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[70] w-[min(22rem,calc(100vw-2rem))] min-w-[18rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-200 p-2">
                <input
                  type="text"
                  dir="rtl"
                  value={searchQuery}
                  placeholder="ابحث عن الدولة أو الرمز"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <ul className="max-h-64 overflow-y-auto py-1">
                {filteredCountries.map((country) => {
                  const isSelected = country.iso2 === selectedCountry

                  return (
                    <li key={country.iso2}>
                      <button
                        type="button"
                        onClick={() => handleCountrySelect(country.iso2)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                          isSelected ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
                        }`}
                      >
                        <span className="text-base leading-none">{toFlagEmoji(country.iso2)}</span>
                        <span className="flex-1 truncate">{country.name}</span>
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
      <style>{`
        .phone-input-shell {
          --react-international-phone-height: 44px;
          --react-international-phone-border-radius: 0.75rem;
          --react-international-phone-border-color: #cbd5e1;
          --react-international-phone-background-color: #ffffff;
          --react-international-phone-text-color: #0f172a;
          --react-international-phone-dropdown-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          --react-international-phone-selected-dropdown-item-background-color: #f0fdfa;
          --react-international-phone-flag-width: 18px;
          --react-international-phone-flag-height: 18px;
        }

        .phone-input-shell .react-international-phone-input-container {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          background-color: #ffffff;
          overflow: visible;
        }

        .phone-input-shell .react-international-phone-input-container:focus-within {
          border-color: #14b8a6;
          box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.1);
        }

        .phone-input-shell .react-international-phone-country-selector-dropdown {
          z-index: 60;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          width: min(22rem, calc(100vw - 2rem));
          min-width: 18rem;
          left: 0;
          top: calc(100% + 0.5rem);
          max-height: 16rem;
        }

        .phone-input-shell .react-international-phone-country-selector-button {
          border: 0;
          background-color: #ffffff;
          box-shadow: none;
        }

        .phone-input-shell .react-international-phone-country-selector-button__flag-emoji {
          margin-left: 0.75rem;
        }

        .phone-input-shell .react-international-phone-input {
          font-size: 0.875rem;
          padding: 0 0.75rem;
          background-color: #ffffff;
          border: 0;
        }
      `}</style>
    </div>
  )
}
