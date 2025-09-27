import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

interface LanguageContextValue {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: typeof i18n.t;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
  storageKey?: string;
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: {},
        },
        ar: {
          translation: {},
        },
      },
      fallbackLng: 'en',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });
}

export function LanguageProvider({
  children,
  defaultLanguage = 'en',
  storageKey = 'theme-preference',
}: LanguageProviderProps): React.ReactElement {
  const { t } = useTranslation();
  
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return defaultLanguage;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.language || defaultLanguage;
      }
    } catch {}
    
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ar')) return 'ar';
    
    return defaultLanguage;
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.setAttribute('lang', language);
    root.setAttribute('dir', direction);
    
    i18n.changeLanguage(language);
  }, [language, direction]);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    
    try {
      const stored = localStorage.getItem(storageKey);
      const current = stored ? JSON.parse(stored) : {};
      localStorage.setItem(storageKey, JSON.stringify({
        ...current,
        language: newLang,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }

    const message = newLang === 'ar' 
      ? 'تم تغيير اللغة إلى العربية'
      : 'Language changed to English';
    
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [storageKey]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key !== storageKey || !e.newValue) return;
      
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.language && parsed.language !== language) {
          setLanguageState(parsed.language);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey, language]);

  return (
    <LanguageContext.Provider 
      value={{
        language,
        direction,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}