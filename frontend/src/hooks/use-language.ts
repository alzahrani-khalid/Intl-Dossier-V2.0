import { useLanguage as useLanguageFromProvider } from '../components/language-provider/language-provider'

/**
 * Re-export the LanguageProvider hook so feature code can keep importing from hooks/
 */
export const useLanguage = useLanguageFromProvider

/**
 * Hook to get just the current language and direction
 * Useful for components that only need to read language state
 */
function useLanguageValue() {
  const { language, direction } = useLanguage()

  return {
    language,
    direction,
    isRtl: direction === 'rtl',
    isLtr: direction === 'ltr',
    isArabic: language === 'ar',
    isEnglish: language === 'en',
  }
}

/**
 * Hook to toggle between languages
 */
function useLanguageToggle() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en')
  }

  return {
    language,
    toggleLanguage,
  }
}

/**
 * Hook to get translation function with namespace support
 */
type TranslateOptions = Record<string, unknown> | undefined

function useTranslate(namespace: string = 'common') {
  const { t } = useLanguage()

  return (key: string, _options?: TranslateOptions) => {
    const fullKey = namespace ? `${namespace}:${key}` : key
    return t(fullKey)
  }
}
