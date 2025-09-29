import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
import enCommon from './en/common';
import arCommon from './ar/common';

export const resources = {
  en: {
    common: enCommon,
  },
  ar: {
    common: arCommon,
  },
} as const;

export const supportedLanguages = ['en', 'ar'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageConfig = {
  en: {
    code: 'en',
    name: { en: 'English', ar: 'الإنجليزية' },
    direction: 'ltr' as const,
    locale: 'en-US',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
    calendar: 'gregorian' as const,
  },
  ar: {
    code: 'ar',
    name: { en: 'Arabic', ar: 'العربية' },
    direction: 'rtl' as const,
    locale: 'ar-SA',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
    calendar: 'gregorian' as const,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'theme-preference',
      convertDetectedLanguage: (lng: string) => {
        // Extract language from preference object if exists
        try {
          const stored = localStorage.getItem('theme-preference');
          if (stored) {
            const prefs = JSON.parse(stored);
            return prefs.language || lng;
          }
        } catch {
          // Fallback to detected language
        }
        return lng.split('-')[0]; // Convert 'en-US' to 'en'
      },
    },

    react: {
      useSuspense: false, // Disable suspense for better control
    },
  });

export default i18n;

// Helper to get current language config
export const getCurrentLanguageConfig = () => {
  const currentLang = i18n.language as SupportedLanguage;
  return languageConfig[currentLang] || languageConfig.en;
};

// Helper to apply language direction to HTML
export const applyLanguageDirection = (language: SupportedLanguage) => {
  const config = languageConfig[language];
  document.documentElement.lang = language;
  document.documentElement.dir = config.direction;
};

// Export type for TypeScript support
export type TranslationKeys = keyof typeof enCommon;