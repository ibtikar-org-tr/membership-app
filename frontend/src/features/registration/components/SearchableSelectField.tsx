import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

type SearchableOption = {
  value: string
  label: string
  secondaryLabel?: string
  leftAdornment?: ReactNode
  rightAdornment?: string
  searchText?: string
}

type SearchableSelectFieldProps = {
  id: string
  label: string
  placeholder: string
  emptyMessage?: string
  disabled?: boolean
  defaultAdornment?: ReactNode
  dropdownZIndex?: number
  value: string
  options: SearchableOption[]
  onChange: (value: string) => void
}

export function SearchableSelectField({
  id,
  label,
  placeholder,
  emptyMessage = 'لا توجد نتائج',
  disabled = false,
  defaultAdornment = <span className="text-base leading-none text-slate-400">🌍</span>,
  dropdownZIndex = 1400,
  value,
  options,
  onChange,
}: SearchableSelectFieldProps) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 288 })

  const selectedOption = useMemo(() => options.find((option) => option.value === value), [options, value])

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return options
    }

    return options.filter((option) => {
      const haystack = `${option.label} ${option.searchText ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [options, searchQuery])

  const updateDropdownPosition = () => {
    const trigger = triggerRef.current
    if (!trigger) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    const maxAllowedWidth = Math.max(220, window.innerWidth - 16)
    const nextWidth = Math.min(Math.max(rect.width, 288), maxAllowedWidth)
    const maxLeft = window.innerWidth - nextWidth - 8
    const nextLeft = Math.min(Math.max(rect.left, 8), Math.max(8, maxLeft))

    setDropdownStyle({
      top: rect.bottom,
      left: nextLeft,
      width: nextWidth,
    })
  }

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
    }
  }, [isOpen])

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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (shellRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return
      }

      if (!shellRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <div ref={shellRef} className="relative" dir="rtl">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((current) => !current)}
          className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition enabled:hover:border-slate-400 enabled:focus:border-teal-500 enabled:focus:ring-2 enabled:focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {selectedOption?.leftAdornment ? (
            <span className="text-base leading-none">{selectedOption.leftAdornment}</span>
          ) : (
            defaultAdornment
          )}
          {selectedOption ? (
            <span className="flex-1 truncate text-right text-slate-900">
              {selectedOption.label}
              {selectedOption.secondaryLabel ? (
                <span className="mr-1 text-xs text-slate-500 opacity-50">({selectedOption.secondaryLabel})</span>
              ) : null}
            </span>
          ) : (
            <span className="flex-1 truncate text-right text-slate-400">{placeholder}</span>
          )}
          <span className="text-xs text-slate-500">▾</span>
        </button>

        {isOpen && !disabled && createPortal(
          <div
            ref={dropdownRef}
            className="overflow-hidden rounded-b-xl border border-t-0 border-slate-200 bg-white shadow-xl"
            style={{
              position: 'fixed',
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              zIndex: dropdownZIndex,
            }}
          >
            <div className="border-b border-slate-200 p-2">
              <input
                ref={searchInputRef}
                type="text"
                dir="rtl"
                value={searchQuery}
                placeholder="ابحث..."
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <ul className="max-h-64 overflow-y-auto py-1">
              {filteredOptions.map((option) => {
                const isSelected = option.value === value

                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                        isSelected ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
                      }`}
                    >
                      {option.leftAdornment ? (
                        <span className="text-base leading-none">{option.leftAdornment}</span>
                      ) : (
                        <span className="w-4" aria-hidden="true" />
                      )}
                      <span dir="rtl" className="flex-1 truncate text-right">
                        {option.label}
                        {option.secondaryLabel ? (
                          <span className="mr-1 text-xs text-slate-500 opacity-50">({option.secondaryLabel})</span>
                        ) : null}
                      </span>
                      {option.rightAdornment ? (
                        <span className="text-xs text-slate-500">{option.rightAdornment}</span>
                      ) : null}
                    </button>
                  </li>
                )
              })}

              {filteredOptions.length === 0 && (
                <li className="px-3 py-3 text-sm text-slate-500">{emptyMessage}</li>
              )}
            </ul>
          </div>,
          document.body,
        )}
      </div>
    </label>
  )
}
