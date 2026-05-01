// Audit (D-12): Language context rarely changes (only on language switch), splitting not needed.
// The context provides language + direction + setLanguage + t which all change together on
// language switch. Most consumers need both language and direction. No cascading re-render issue.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getDirection, type SupportedLanguage } from '../../i18n'

interface LanguageContextValue {
  language: SupportedLanguage
  direction: 'ltr' | 'rtl'
  setLanguage: (language: SupportedLanguage) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

interface LanguageProviderProps {
  children: React.ReactNode
  initialLanguage?: SupportedLanguage
}

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === 'en' || value === 'ar'
}

export function LanguageProvider({ children, initialLanguage = 'en' }: LanguageProviderProps) {
  const { i18n, t } = useTranslation()
  const [language, setLanguageState] = useState<SupportedLanguage>(initialLanguage)
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr')

  // Load language preference from localStorage on mount.
  // Priority: canonical design-system id.locale > user-preferences > ui-storage
  // (Zustand) > i18nextLng > browser detection.
  useEffect(() => {
    const designLocale = localStorage.getItem('id.locale')
    if (isSupportedLanguage(designLocale)) {
      setLanguageState(designLocale)
      void i18n.changeLanguage(designLocale)
      return
    }

    // First check user-preferences (set by setLanguage)
    const userPrefs = localStorage.getItem('user-preferences')
    if (userPrefs) {
      try {
        const parsed = JSON.parse(userPrefs)
        const storedLang = parsed?.language
        if (isSupportedLanguage(storedLang)) {
          setLanguageState(storedLang)
          i18n.changeLanguage(storedLang)
          return
        }
      } catch {
        // Silently ignore parse errors
      }
    }

    // Fallback: ui-storage (Zustand persisted store)
    const uiStorage = localStorage.getItem('ui-storage')
    if (uiStorage) {
      try {
        const parsed = JSON.parse(uiStorage)
        const storedLang = parsed?.state?.language
        if (isSupportedLanguage(storedLang)) {
          setLanguageState(storedLang)
          i18n.changeLanguage(storedLang)
          return
        }
      } catch {
        // Silently ignore parse errors
      }
    }

    // Fallback to i18nextLng (set by language detector)
    const i18nextLng = localStorage.getItem('i18nextLng')
    if (isSupportedLanguage(i18nextLng)) {
      setLanguageState(i18nextLng)
      // Don't call changeLanguage - i18n already initialized with this value
      return
    }

    // Final fallback: browser language detection
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('ar')) {
      setLanguageState('ar')
      i18n.changeLanguage('ar')
    }
  }, [i18n])

  // Apply language direction
  useEffect(() => {
    const dir = getDirection(language)
    setDirection(dir)
    document.documentElement.dir = dir
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback(
    async (newLanguage: SupportedLanguage) => {
      if (!isSupportedLanguage(newLanguage)) {
        console.error(`Invalid language: ${newLanguage}`)
        return
      }

      setLanguageState(newLanguage)

      // Change i18n language
      await i18n.changeLanguage(newLanguage)

      // Apply direction
      const dir = getDirection(newLanguage)
      setDirection(dir)
      document.documentElement.dir = dir
      document.documentElement.lang = newLanguage

      // Save to localStorage
      const stored = localStorage.getItem('user-preferences')
      let prefs = {
        theme: 'gastat',
        colorMode: 'light',
        language: newLanguage,
        updatedAt: new Date().toISOString(),
      }
      if (stored) {
        try {
          const existing = JSON.parse(stored)
          prefs = { ...existing, language: newLanguage, updatedAt: new Date().toISOString() }
        } catch {
          // Use defaults
        }
      }
      localStorage.setItem('user-preferences', JSON.stringify(prefs))
      localStorage.setItem('id.locale', newLanguage)
      localStorage.setItem('i18nextLng', newLanguage)

      // Dispatch custom event for cross-component sync
      window.dispatchEvent(
        new CustomEvent('languageChange', {
          detail: { language: newLanguage, direction: dir },
        }),
      )

      // Dispatch for cross-tab sync
      window.dispatchEvent(
        new CustomEvent('preferenceChange', {
          detail: { language: newLanguage },
        }),
      )
    },
    [i18n],
  )

  // Listen for language changes from other components or tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user-preferences' && e.newValue) {
        try {
          const prefs = JSON.parse(e.newValue)
          if (isSupportedLanguage(prefs.language)) {
            setLanguageState(prefs.language)
            i18n.changeLanguage(prefs.language)
          }
        } catch (err) {
          console.warn('Failed to parse preference update:', err)
        }
      }
    }

    const handleLanguageChange = (event: Event) => {
      const { detail } = event as CustomEvent<{ language?: unknown }>
      if (isSupportedLanguage(detail?.language)) {
        setLanguageState(detail.language)
        i18n.changeLanguage(detail.language)
      }
    }

    const handleDesignChange = (event: Event) => {
      const { detail } = event as CustomEvent<{ locale?: unknown }>
      const locale = detail?.locale
      if (isSupportedLanguage(locale)) {
        setLanguageState(locale)
        i18n.changeLanguage(locale)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('languageChange', handleLanguageChange)
    window.addEventListener('designChange', handleDesignChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('languageChange', handleLanguageChange)
      window.removeEventListener('designChange', handleDesignChange)
    }
  }, [i18n])

  const value: LanguageContextValue = {
    language,
    direction,
    setLanguage,
    t: (key: string) => t(key),
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
