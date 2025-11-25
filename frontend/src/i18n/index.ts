import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from './en/common.json'
import arCommon from './ar/common.json'
import enIntake from './en/intake.json'
import arIntake from './ar/intake.json'
import enDossiers from './en/dossiers.json'
import arDossiers from './ar/dossiers.json'
import enDossier from './en/dossier.json'
import arDossier from './ar/dossier.json'
import enPositions from './en/positions.json'
import arPositions from './ar/positions.json'
import enAssignments from './en/assignments.json'
import arAssignments from './ar/assignments.json'
import enForums from './en/forums.json'
import arForums from './ar/forums.json'
import enContacts from './en/contacts.json'
import arContacts from './ar/contacts.json'
import enCommitments from './en/commitments.json'
import arCommitments from './ar/commitments.json'
// Force reload - updated 2025-11-18 - v4 - Added commitments namespace

const supportedLanguages = ['en', 'ar'] as const
export type SupportedLanguage = typeof supportedLanguages[number]

const resources = {
  en: {
    translation: enCommon,
    intake: enIntake,
    dossiers: enDossiers,
    dossier: enDossier,
    positions: enPositions,
    assignments: enAssignments,
    forums: enForums,
    contacts: enContacts,
    commitments: enCommitments,
  },
  ar: {
    translation: arCommon,
    intake: arIntake,
    dossiers: arDossiers,
    dossier: arDossier,
    positions: arPositions,
    assignments: arAssignments,
    forums: arForums,
    contacts: arContacts,
    commitments: arCommitments,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
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

    react: {
      useSuspense: false,
    },

    // Add missing keys handling
    saveMissing: false,
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}`)
      }
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