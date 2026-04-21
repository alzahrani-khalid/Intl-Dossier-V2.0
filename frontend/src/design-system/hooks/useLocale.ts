/**
 * Reads the current locale + setter from `DesignProvider`.
 *
 * Persisted under localStorage key `id.locale` as `'en'` or `'ar'`. Setting
 * locale also:
 *   - mirrors to `document.documentElement.lang` and `dir` (`rtl` for ar)
 *   - calls `i18n.changeLanguage` so react-i18next consumers re-render
 *
 * T-34-01: unknown persisted values deserialise to `'en'`.
 */

import { useContext } from 'react'

import { DesignContext } from '@/design-system/DesignProvider'

export type Locale = 'en' | 'ar'

export interface UseLocaleResult {
  locale: Locale
  setLocale: (next: Locale) => void
}

export function useLocale(): UseLocaleResult {
  const ctx = useContext(DesignContext)
  if (!ctx) {
    throw new Error('useLocale must be used within a <DesignProvider>')
  }
  return { locale: ctx.locale, setLocale: ctx.setLocale }
}
