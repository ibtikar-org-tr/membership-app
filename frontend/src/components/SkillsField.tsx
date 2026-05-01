import { useEffect, useState } from 'react'
import { fetchSkills } from '../api/vms'
import { POPULAR_SKILLS, POPULAR_SKILLS_INITIAL_SUGGESTIONS } from '../config/popularSkills'
import { SearchableTagsField } from './registration/SearchableTagsField'

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

  return (
    <SearchableTagsField
      id={id}
      name="skills"
      label={label}
      required={required}
      value={value}
      onChange={onChange}
      options={availableSkills}
      initialSuggestions={POPULAR_SKILLS_INITIAL_SUGGESTIONS}
      allowCustom={allowCustom}
      placeholder={placeholder}
      helperText={helperText}
    />
  )
}
