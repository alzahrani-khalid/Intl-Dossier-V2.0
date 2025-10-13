import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import ar from './locales/ar.json';

const LANGUAGE_STORAGE_KEY = '@intl_dossier:language';

// Detect if RTL is needed
const isRTL = (language: string): boolean => {
  return language === 'ar';
};

// Configure i18next
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: Localization.locale.split('-')[0], // Use device locale by default
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Load saved language preference
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then(savedLanguage => {
  if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
    i18n.changeLanguage(savedLanguage);
    I18nManager.forceRTL(isRTL(savedLanguage));
  } else {
    // Set RTL based on detected language
    const detectedLang = i18n.language;
    I18nManager.forceRTL(isRTL(detectedLang));
  }
});

// Save language preference when changed
i18n.on('languageChanged', (lng: string) => {
  AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  I18nManager.forceRTL(isRTL(lng));
});

export default i18n;
