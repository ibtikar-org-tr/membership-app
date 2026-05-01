import { useEffect, useState } from 'react'
import { fetchSkills } from '../api/vms'
import { POPULAR_SKILLS, POPULAR_SKILLS_INITIAL_SUGGESTIONS } from '../config/popularSkills'
import { SearchableTagsField } from './registration/SearchableTagsField'

type SkillLevel = 'required' | 'recommended' | 'aquired'

type SkillsFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  helperText?: string
  allowCustom?: boolean
}

const LEVELS: SkillLevel[] = ['required', 'recommended', 'aquired']

function parseToMap(value: string): Record<string, SkillLevel> {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return {}

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
      // fall through to CSV parsing
    }
  }

  return Object.fromEntries(
    trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => [item, 'recommended'] as [string, SkillLevel]),
  )
}

export function SkillsField({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder = 'ابحث عن مهارة أو أضف مهارة جديدة',
  helperText,
  allowCustom = true,
}: SkillsFieldProps) {
  const [availableSkills, setAvailableSkills] = useState<string[]>(POPULAR_SKILLS)
  const [skillsMap, setSkillsMap] = useState<Record<string, SkillLevel>>(() => parseToMap(value))

  useEffect(() => {
    let isActive = true

    async function loadSkills() {
      try {
        const payload = await fetchSkills()
        if (!isActive) {
          return
        }

        const names = payload.skills.map((skill) => skill.name)
        setAvailableSkills(Array.from(new Set([...POPULAR_SKILLS, ...names])))
      } catch {
        if (isActive) {
          setAvailableSkills(POPULAR_SKILLS)
        }
      }
    }

    void loadSkills()

    return () => {
      isActive = false
    }
  }, [])

  // Keep in sync if parent value changes externally
  useEffect(() => {
    setSkillsMap(parseToMap(value))
  }, [value])

  // when skillsMap changes, notify parent as JSON
  useEffect(() => {
    onChange(JSON.stringify(skillsMap))
  }, [skillsMap])

  const handleTagsChange = (csv: string) => {
    const tags = csv
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    setSkillsMap((prev) => {
      const next: Record<string, SkillLevel> = {}
      for (const tag of tags) {
        next[tag] = prev[tag] ?? 'recommended'
      }
      return next
    })
  }

  const handleLevelChange = (skill: string, level: SkillLevel) => {
    setSkillsMap((prev) => ({ ...prev, [skill]: level }))
  }

  return (
    <SearchableTagsField
      id={id}
      name="skills"
      label={label}
      required={required}
      value={Object.keys(skillsMap).join(', ')}
      onChange={handleTagsChange}
      options={availableSkills}
      initialSuggestions={POPULAR_SKILLS_INITIAL_SUGGESTIONS}
      allowCustom={allowCustom}
      placeholder={placeholder}
      helperText={helperText}
      hiddenValue={JSON.stringify(Object.keys(skillsMap).length ? skillsMap : {})}
      renderTag={(tag, onRemove) => (
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
          <span>{tag}</span>
          <select
            value={skillsMap[tag] ?? 'recommended'}
            onChange={(e) => handleLevelChange(tag, e.target.value as SkillLevel)}
            className="rounded-md border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-800"
            aria-label={`مستوى ${tag}`}
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-teal-700 hover:bg-teal-100"
            aria-label={`إزالة ${tag}`}
          >
            x
          </button>
        </span>
      )}
    />
  )
}
