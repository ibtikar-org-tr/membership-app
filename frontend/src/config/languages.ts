import iso from 'iso-countries-languages'
import type { SearchableTagOption } from '../components/registration/SearchableTagsField'

const languagesAr = iso.getLanguages('ar') as Record<string, string>
const languagesEn = iso.getLanguages('en') as Record<string, string>

const languageCodes = Object.keys(languagesEn).filter((code) => {
  return Boolean(languagesEn[code])
})

export const POPULAR_LANGUAGES_INITIAL_SUGGESTIONS = [
  'English',
  'Arabic',
  'Turkish',
  'French',
  'German',
  'Spanish',
  'Russian',
  'Portuguese',
  'Chinese',
]

export const POPULAR_LANGUAGE_OPTIONS: SearchableTagOption[] = languageCodes
  .map((code) => {
    const englishName = languagesEn[code]
    const arabicName = languagesAr[code] || englishName

    return {
      value: englishName,
      label: arabicName,
      searchText: `${arabicName} ${englishName} ${code}`,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label, 'ar'))
