import { useLanguage as useLanguageFromProvider } from '../components/language-provider/language-provider'

/**
 * Re-export the LanguageProvider hook so feature code can keep importing from hooks/
 */
export const useLanguage = useLanguageFromProvider
