import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type SearchableTagOption = {
  value: string
  label: string
  searchText?: string
}

type SearchableTagsFieldProps = {
  id: string
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  options: Array<string | SearchableTagOption>
  initialSuggestions?: string[]
  allowCustom?: boolean
  placeholder?: string
  helperText?: string
}

function parseValue(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function dedupe(values: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const normalized = value.toLowerCase()
    if (!seen.has(normalized)) {
      seen.add(normalized)
      result.push(value)
    }
  }

  return result
}

export function SearchableTagsField({
  id,
  label,
  required = false,
  value,
  onChange,
  options,
  initialSuggestions = [],
  allowCustom = true,
  placeholder = 'ابحث أو اكتب قيمة ثم اضغط Enter',
  helperText,
}: SearchableTagsFieldProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 260 })

  const selected = useMemo(() => parseValue(value), [value])
  const selectedSet = useMemo(
    () => new Set(selected.map((item) => item.toLowerCase())),
    [selected],
  )

  const normalizedOptions = useMemo<SearchableTagOption[]>(() => {
    return options.map((option) => {
      if (typeof option === 'string') {
        return {
          value: option,
          label: option,
          searchText: option,
        }
      }

      return {
        value: option.value,
        label: option.label,
        searchText: option.searchText ?? `${option.label} ${option.value}`,
      }
    })
  }, [options])

  const optionsByValue = useMemo(() => {
    const map = new Map<string, SearchableTagOption>()
    for (const option of normalizedOptions) {
      map.set(option.value.toLowerCase(), option)
    }
    return map
  }, [normalizedOptions])

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const availableOptions = normalizedOptions.filter(
      (option) => !selectedSet.has(option.value.toLowerCase()),
    )

    if (!normalizedQuery && initialSuggestions.length > 0) {
      const seen = new Set<string>()

      return initialSuggestions
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => optionsByValue.get(item.toLowerCase()))
        .filter((item): item is SearchableTagOption => Boolean(item))
        .filter((option) => {
          const normalized = option.value.toLowerCase()
          if (seen.has(normalized)) {
            return false
          }
          seen.add(normalized)
          return true
        })
        .filter((option) => !selectedSet.has(option.value.toLowerCase()))
        .slice(0, 12)
    }

    return availableOptions
      .filter((option) => {
        if (!normalizedQuery) {
          return true
        }
        const haystack = `${option.label} ${option.searchText ?? ''} ${option.value}`.toLowerCase()
        return haystack.includes(normalizedQuery)
      })
      .slice(0, 12)
  }, [normalizedOptions, query, selectedSet, initialSuggestions, optionsByValue])

  const canAddCustom = useMemo(() => {
    if (!allowCustom) {
      return false
    }

    const trimmed = query.trim()
    if (!trimmed) {
      return false
    }

    return !selectedSet.has(trimmed.toLowerCase())
  }, [query, selectedSet, allowCustom])

  const updateSelected = (next: string[]) => {
    onChange(dedupe(next).join(', '))
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || selectedSet.has(trimmed.toLowerCase())) {
      return
    }

    updateSelected([...selected, trimmed])
    setQuery('')
  }

  const removeTag = (tag: string) => {
    updateSelected(selected.filter((item) => item.toLowerCase() !== tag.toLowerCase()))
  }

  const updateDropdownPosition = () => {
    const trigger = triggerRef.current
    if (!trigger) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    const maxAllowedWidth = Math.max(220, window.innerWidth - 16)
    const nextWidth = Math.min(Math.max(rect.width, 260), maxAllowedWidth)
    const maxLeft = window.innerWidth - nextWidth - 8
    const nextLeft = Math.min(Math.max(rect.left, 8), Math.max(8, maxLeft))

    setDropdownStyle({
      top: rect.bottom + 4,
      left: nextLeft,
      width: nextWidth,
    })
  }

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
    }
  }, [isOpen, selected.length])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleWindowChange = () => updateDropdownPosition()
    window.addEventListener('resize', handleWindowChange)
    window.addEventListener('scroll', handleWindowChange, true)

    return () => {
      window.removeEventListener('resize', handleWindowChange)
      window.removeEventListener('scroll', handleWindowChange, true)
    }
  }, [isOpen])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return
      }

      if (!containerRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2 text-sm font-medium text-slate-700">
      <label htmlFor={id}>
        {label}
        {required && <span className="mr-1 font-bold text-red-600" aria-hidden="true">*</span>}
      </label>

      <input
        tabIndex={-1}
        aria-hidden="true"
        value={selected.join(', ')}
        onChange={() => undefined}
        required={required}
        className="sr-only"
      />

      <div
        ref={triggerRef}
        className="rounded-xl border border-slate-300 bg-white p-2 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100"
      >
        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selected.map((tag) => (
              <span
                key={tag.toLowerCase()}
                className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-teal-700 hover:bg-teal-100"
                  aria-label={`إزالة ${tag}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          id={id}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()

              if (query.trim()) {
                const exactMatch = normalizedOptions.find((option) => {
                  return (
                    option.value.toLowerCase() === query.trim().toLowerCase() ||
                    option.label.toLowerCase() === query.trim().toLowerCase()
                  )
                })
                if (exactMatch) {
                  addTag(exactMatch.value)
                } else if (allowCustom) {
                  addTag(query)
                }
              }
            }
          }}
          placeholder={placeholder}
          className="h-9 w-full border-none px-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      {helperText && <p className="text-xs font-normal text-slate-500/70">{helperText}</p>}

      {isOpen && (filteredOptions.length > 0 || canAddCustom) && createPortal(
        <div
          ref={dropdownRef}
          className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          style={{
            position: 'fixed',
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            width: dropdownStyle.width,
            zIndex: 1400,
          }}
        >
          {filteredOptions.map((option) => (
            <button
              key={option.value.toLowerCase()}
              type="button"
              onClick={() => addTag(option.value)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <span>{option.label}</span>
              <span className="text-xs text-slate-400">إضافة</span>
            </button>
          ))}

          {canAddCustom && (
            <button
              type="button"
              onClick={() => addTag(query)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-teal-700 transition hover:bg-teal-50"
            >
              <span>{query.trim()}</span>
              <span className="text-xs">Custom</span>
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}