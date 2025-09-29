import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getDirection, type SupportedLanguage } from '../../i18n';

interface LanguageContextValue {
  language: SupportedLanguage;
  direction: 'ltr' | 'rtl';
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
}

export function LanguageProvider({
  children,
  initialLanguage = 'en',
}: LanguageProviderProps) {
  const { i18n, t } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(initialLanguage);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user-preferences');
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        if (prefs.language && (prefs.language === 'en' || prefs.language === 'ar')) {
          setLanguageState(prefs.language);
          i18n.changeLanguage(prefs.language);
        }
      } catch (e) {
        // Silently ignore parse errors
      }
    } else {
      // Use browser language detection
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ar')) {
        setLanguageState('ar');
        i18n.changeLanguage('ar');
      }
    }
  }, [i18n]);

  // Apply language direction
  useEffect(() => {
    const dir = getDirection(language);
    setDirection(dir);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    if (newLanguage !== 'en' && newLanguage !== 'ar') {
      console.error(`Invalid language: ${newLanguage}`);
      return;
    }

    setLanguageState(newLanguage);
    
    // Change i18n language
    await i18n.changeLanguage(newLanguage);

    // Apply direction
    const dir = getDirection(newLanguage);
    setDirection(dir);
    document.documentElement.dir = dir;
    document.documentElement.lang = newLanguage;

    // Save to localStorage
    const stored = localStorage.getItem('user-preferences');
    let prefs = { theme: 'gastat', colorMode: 'light', language: newLanguage, updatedAt: new Date().toISOString() };
    if (stored) {
      try {
        const existing = JSON.parse(stored);
        prefs = { ...existing, language: newLanguage, updatedAt: new Date().toISOString() };
      } catch (e) {
        // Use defaults
      }
    }
    localStorage.setItem('user-preferences', JSON.stringify(prefs));

    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new CustomEvent('languageChange', {
      detail: { language: newLanguage, direction: dir }
    }));

    // Dispatch for cross-tab sync
    window.dispatchEvent(new CustomEvent('preferenceChange', {
      detail: { language: newLanguage }
    }));
  }, [i18n]);

  // Listen for language changes from other components or tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user-preferences' && e.newValue) {
        try {
          const prefs = JSON.parse(e.newValue);
          if (prefs.language && (prefs.language === 'en' || prefs.language === 'ar')) {
            setLanguageState(prefs.language);
            i18n.changeLanguage(prefs.language);
          }
        } catch (err) {
          console.warn('Failed to parse preference update:', err);
        }
      }
    };

    const handleLanguageChange = (e: CustomEvent) => {
      if (e.detail?.language) {
        setLanguageState(e.detail.language);
        i18n.changeLanguage(e.detail.language);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languageChange' as any, handleLanguageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChange' as any, handleLanguageChange);
    };
  }, [i18n]);

  const value: LanguageContextValue = {
    language,
    direction,
    setLanguage,
    t: t as any,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}