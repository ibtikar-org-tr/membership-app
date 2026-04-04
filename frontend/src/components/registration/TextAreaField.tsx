type TextAreaFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
  helperText?: string
  error?: string
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  helperText,
  error,
}: TextAreaFieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      {helperText && <span className="text-xs text-slate-500">{helperText}</span>}
      <textarea
        id={id}
        value={value}
        rows={rows}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-300'
        }`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  )
}
