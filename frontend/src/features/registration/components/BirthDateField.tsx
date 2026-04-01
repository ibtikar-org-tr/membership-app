import { useEffect, useRef, useState } from 'react'

type BirthDateFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function parseIsoDate(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) {
    return { year: '', month: '', day: '' }
  }

  return {
    year: matched[1],
    month: matched[2],
    day: matched[3],
  }
}

export function BirthDateField({ id, label, value, onChange, required = false }: BirthDateFieldProps) {
  const [hasBlurred, setHasBlurred] = useState(false)
  const monthRef = useRef<HTMLInputElement | null>(null)
  const dayRef = useRef<HTMLInputElement | null>(null)
  const parsed = parseIsoDate(value)
  const [year, setYear] = useState(parsed.year)
  const [month, setMonth] = useState(parsed.month)
  const [day, setDay] = useState(parsed.day)

  useEffect(() => {
    const next = parseIsoDate(value)
    setYear(next.year)
    setMonth(next.month)
    setDay(next.day)
  }, [value])

  const sanitizeNumber = (raw: string, maxLength: number) => {
    return raw.replaceAll(/\D/g, '').slice(0, maxLength)
  }

  const commitIfCompleteAndValid = (nextYear: string, nextMonth: string, nextDay: string) => {
    if (nextYear.length !== 4 || nextMonth.length !== 2 || nextDay.length !== 2) {
      onChange('')
      return
    }

    const monthNumber = Number(nextMonth)
    const dayNumber = Number(nextDay)
    if (monthNumber < 1 || monthNumber > 12) {
      onChange('')
      return
    }

    const maxDay = getDaysInMonth(Number(nextYear), monthNumber)
    if (dayNumber < 1 || dayNumber > maxDay) {
      onChange('')
      return
    }

    onChange(`${nextYear}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`)
  }

  const handleDayChange = (rawValue: string) => {
    const nextDay = sanitizeNumber(rawValue, 2)
    setDay(nextDay)
    commitIfCompleteAndValid(year, month, nextDay)
  }

  const handleMonthChange = (rawValue: string) => {
    const nextMonth = sanitizeNumber(rawValue, 2)
    setMonth(nextMonth)
    commitIfCompleteAndValid(year, nextMonth, day)
    if (nextMonth.length === 2) {
      dayRef.current?.focus()
    }
  }

  const handleYearChange = (rawValue: string) => {
    const nextYear = sanitizeNumber(rawValue, 4)
    setYear(nextYear)
    commitIfCompleteAndValid(nextYear, month, day)
    if (nextYear.length === 4) {
      monthRef.current?.focus()
    }
  }

  const currentYear = new Date().getFullYear()
  const minimumYear = 1900
  const isInvalidYear = year.length === 4 && (Number(year) < minimumYear || Number(year) > currentYear)
  const isInvalidMonth = month.length > 0 && (Number(month) < 1 || Number(month) > 12)
  const invalidDayRange = year.length === 4 && month.length > 0 ? getDaysInMonth(Number(year), Number(month)) : 31
  const isInvalidDay = day.length > 0 && (Number(day) < 1 || Number(day) > invalidDayRange)
  const showError = hasBlurred && (isInvalidYear || isInvalidMonth || isInvalidDay || value === '')

  return (
    <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="grid grid-cols-[1.4fr_auto_1fr_auto_1fr] items-center gap-2" dir="ltr">
        <input
          id={`${id}-year`}
          value={year}
          inputMode="numeric"
          placeholder="YYYY"
          onChange={(event) => handleYearChange(event.target.value)}
          onBlur={() => setHasBlurred(true)}
          required={required}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <span className="text-slate-400">-</span>

        <input
          id={`${id}-month`}
          ref={monthRef}
          value={month}
          inputMode="numeric"
          placeholder="MM"
          onChange={(event) => handleMonthChange(event.target.value)}
          onBlur={() => setHasBlurred(true)}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <span className="text-slate-400">-</span>

        <input
          id={`${id}-day`}
          ref={dayRef}
          value={day}
          inputMode="numeric"
          placeholder="DD"
          onChange={(event) => handleDayChange(event.target.value)}
          onBlur={() => setHasBlurred(true)}
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>
      <p className="text-xs font-normal text-slate-500/70">صيغة سريعة: YYYY-MM-DD مع انتقال تلقائي بين الخانات</p>
      {showError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          يرجى إدخال تاريخ ميلاد صالح بين 1900 والسنة الحالية.
        </p>
      )}
    </div>
  )
}
