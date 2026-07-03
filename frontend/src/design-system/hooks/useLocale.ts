/**
 * Reads the current locale + setter from `DesignProvider`.
 *
 * `locale` is persisted under localStorage key `id.locale` as `'en'` or `'ar'`.
 * `setLocale` is the DesignProvider setter, which DELEGATES rather than mutating
 * the document directly: it updates state, persists `id.locale`, and defers the
 * language switch to runtime via a dynamic `import('@/i18n')` → `i18n.changeLanguage`
 * (avoiding a circular dependency) — it does NOT call `i18n.changeLanguage`
 * synchronously and does NOT write `<html dir/lang>` itself. The single owner of
 * the runtime `<html dir/lang>` writes is the `DirectionProvider`
 * (`components/ui/direction`), which derives them from `i18n.language`; keeping a
 * synchronous mirror here would re-open the one-frame disagreement window. This
 * hook only surfaces the value + delegated setter.
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
