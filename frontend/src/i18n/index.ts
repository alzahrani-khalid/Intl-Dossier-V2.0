import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

const supportedLanguages = ['en', 'ar'] as const
export type SupportedLanguage = typeof supportedLanguages[number]

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    supportedLngs: supportedLanguages,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    react: {
      useSuspense: false,
    },
  })

// Function to check if current language is RTL
export const isRTL = (lang: string = i18n.language): boolean => {
  return lang === 'ar'
}

// Function to get text direction
export const getDirection = (lang: string = i18n.language): 'rtl' | 'ltr' => {
  return isRTL(lang) ? 'rtl' : 'ltr'
}

// Function to switch language and update document direction
export const switchLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang)
  document.documentElement.dir = getDirection(lang)
  document.documentElement.lang = lang
}

// Set initial direction
document.documentElement.dir = getDirection()
document.documentElement.lang = i18n.language

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = getDirection(lng)
  document.documentElement.lang = lng
})

export default i18n