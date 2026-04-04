import { useState } from 'react'

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'date' | 'url' | 'tel' | 'number'
  placeholder?: string
  required?: boolean
  validationPattern?: RegExp
  validationMessage?: string
  inputDir?: 'ltr' | 'rtl' | 'auto'
  helperText?: string
}

export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  validationPattern,
  validationMessage,
  inputDir = 'auto',
  helperText,
}: TextFieldProps) {
  const [hasBlurred, setHasBlurred] = useState(false)
  const isInvalid = Boolean(validationPattern) && value.trim().length > 0 && !validationPattern!.test(value)
  const showError = hasBlurred && isInvalid

  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-2 text-sm font-medium text-slate-700">
      <span>
        {label}
        {required && <span className="mr-1 font-bold text-red-600" aria-hidden="true">*</span>}
      </span>
      <input
        id={id}
        type={type}
        dir={inputDir}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setHasBlurred(true)}
        className={`h-11 w-full min-w-0 rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
          showError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
            : 'border-slate-300 focus:border-teal-500 focus:ring-teal-100'
        }`}
      />
      {helperText && !showError && (
        <p className="text-xs font-normal text-slate-500/70">{helperText}</p>
      )}
      {showError && validationMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {validationMessage}
        </p>
      )}
    </label>
  )
}
