import { useEffect, useMemo, useRef, useState } from 'react'

type EmailFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

function splitEmailParts(email: string) {
  const atIndex = email.indexOf('@')
  if (atIndex === -1) {
    return {
      localPart: email,
      domainPart: '',
    }
  }

  return {
    localPart: email.slice(0, atIndex),
    domainPart: email.slice(atIndex + 1),
  }
}

export function EmailField({ id, label, value, onChange, required = false }: EmailFieldProps) {
  const domainInputRef = useRef<HTMLInputElement | null>(null)
  const { localPart: initialLocalPart, domainPart: initialDomainPart } = useMemo(
    () => splitEmailParts(value),
    [value],
  )

  const [localPart, setLocalPart] = useState(initialLocalPart)
  const [domainPart, setDomainPart] = useState(initialDomainPart)

  useEffect(() => {
    const { localPart: nextLocalPart, domainPart: nextDomainPart } = splitEmailParts(value)
    setLocalPart(nextLocalPart)
    setDomainPart(nextDomainPart)
  }, [value])

  const syncValue = (nextLocalPart: string, nextDomainPart: string) => {
    const hasAnyPart = nextLocalPart.length > 0 || nextDomainPart.length > 0
    const nextEmail = hasAnyPart ? `${nextLocalPart}@${nextDomainPart}` : ''
    onChange(nextEmail)
  }

  const handleLocalPartChange = (nextRawValue: string) => {
    if (nextRawValue.includes('@')) {
      const [rawLocal = '', ...rest] = nextRawValue.split('@')
      const appendedDomain = rest.join('@')
      const nextDomainPart = `${appendedDomain}${domainPart}`

      setLocalPart(rawLocal)
      setDomainPart(nextDomainPart)
      syncValue(rawLocal, nextDomainPart)

      requestAnimationFrame(() => {
        domainInputRef.current?.focus()
        if (domainInputRef.current) {
          const end = domainInputRef.current.value.length
          domainInputRef.current.setSelectionRange(end, end)
        }
      })
      return
    }

    setLocalPart(nextRawValue)
    syncValue(nextRawValue, domainPart)
  }

  const handleDomainPartChange = (nextRawValue: string) => {
    const sanitizedDomain = nextRawValue.replaceAll('@', '')
    setDomainPart(sanitizedDomain)
    syncValue(localPart, sanitizedDomain)
  }

  const handleLocalPartKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== '@') {
      return
    }

    event.preventDefault()
    requestAnimationFrame(() => {
      domainInputRef.current?.focus()
    })
  }

  return (
    <label htmlFor={`${id}-local`} className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
      {label}
      <div
        className="grid grid-cols-[2fr_auto_1fr] items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100"
        dir="ltr"
      >
        <input
          id={`${id}-local`}
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required={required}
          placeholder="name"
          value={localPart}
          onChange={(event) => handleLocalPartChange(event.target.value)}
          onKeyDown={handleLocalPartKeyDown}
          className="h-11 border-0 bg-transparent px-3 text-left text-sm text-slate-900 outline-none placeholder:text-slate-400"
          dir="ltr"
        />
        <div className="flex h-11 w-12 items-center justify-center border-x border-slate-300 bg-slate-50 text-base font-bold text-slate-700" aria-hidden="true">
          @
        </div>
        <input
          id={`${id}-domain`}
          ref={domainInputRef}
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required={required}
          placeholder="example.com"
          value={domainPart}
          onChange={(event) => handleDomainPartChange(event.target.value)}
          className="h-11 border-0 bg-transparent px-3 text-left text-sm text-slate-900 outline-none placeholder:text-slate-400"
          dir="ltr"
        />
      </div>
    </label>
  )
}
