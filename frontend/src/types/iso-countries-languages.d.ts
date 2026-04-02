declare module 'iso-countries-languages' {
  export type SupportedLocale =
    | 'en'
    | 'ar'
    | 'fr'
    | 'es'
    | 'de'
    | 'it'
    | 'pt'
    | 'zh'
    | 'tr'
    | 'ru'

  export interface IsoCountriesLanguagesApi {
    getLanguages(locale: SupportedLocale | string): Record<string, string>
  }

  const iso: IsoCountriesLanguagesApi
  export default iso
}
