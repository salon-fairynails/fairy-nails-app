import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from '../../../public/locales/de/common.json'
import en from '../../../public/locales/en/common.json'
import vi from '../../../public/locales/vi/common.json'

export const defaultLocale = 'de'
export const locales = ['de', 'en', 'vi'] as const
export type Locale = (typeof locales)[number]

// Einmalige synchrone Initialisierung (Übersetzungen sind gebundelt)
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    resources: {
      de: { common: de },
      en: { common: en },
      vi: { common: vi },
    },
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
}

export async function initI18n(locale: Locale = defaultLocale) {
  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale)
  }
  return i18n
}

export default i18n
